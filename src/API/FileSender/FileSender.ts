import type { UploadResumeData } from "../../RestoreUploads/types";
import apiRequest, { type DefaultErrorBody } from "../apiRequest";
import { SERVER_URL } from "../config";
import { ResumedChunkSelector, SequentialChunkSelector, type ChunkSelectStrategy } from "./ChunkSelectStrategy";
import { ChunkSender, type ChunkUploadResponse } from "./ChunkSender";

type SendingStatus = 'sending' | 'cancel' | 'notRunning' | 'preparing' | 'complete' | 'canceling' | 'building';

interface SessionCheckStatusResponse {
  status: 'building' | 'complete' | 'error' | 'uploading' | 'cancelled';
}

export interface SessionIniResponse {
  chunkSize: number;
  chunksCount: number;
  path: string;
  sessionId: number;
}

type FileSenderConstruct =
  | {
    file: File,
    destinationDirId: number | 'root';
    retriesCount: number;
  }
  | {
    resumeData: UploadResumeData,
    retriesCount: number;
  };

export class FileSender {
  static STATUS_SENDING = "sending";
  static STATUS_CANCEL = "cancel";
  static STATUS_NOT_RUNNING = "notRunning";
  static STATUS_PREPARING = "preparing";
  static STATUS_COMPLETE = "complete";
  static STATUS_CANCELING = "canceling";
  static STATUS_BUILDING = "building";

  public onChunkLoad?: (data: ChunkUploadResponse) => void;
  public onFileLoad?: () => void;
  public onStatusUpdate?: (status: SendingStatus) => void;
  public onError?: (message: string) => void;

  private status: SendingStatus = 'notRunning';
  private file: File;
  private destinationDirId: number | "root";
  private retriesCount: number;
  private serverUrl: string = SERVER_URL;
  private apiClient = apiRequest();
  private sessionInfo?: SessionIniResponse;
  private chunkSender?: ChunkSender;

  constructor(params: FileSenderConstruct) {
    if ('resumeData' in params) {
      this.sessionInfo = {
        chunksCount: params.resumeData.chunksCount,
        chunkSize: params.resumeData.chunkSize,
        path: params.resumeData.path,
        sessionId: params.resumeData.id,
      };

      this.file = params.resumeData.file;
      this.retriesCount = params.retriesCount;
      this.destinationDirId = params.resumeData.destinationDirId;

      this.chunkSender = this.createChunkSender(new ResumedChunkSelector(params.resumeData.readyChunks, params.resumeData.chunksCount));
    }
    else {
      this.file = params.file;
      this.retriesCount = params.retriesCount;
      this.destinationDirId = params.destinationDirId;
      this.retriesCount = params.retriesCount;
    }
  }

  async initialize() {
    if (this.status == 'preparing')
      throw new Error('Инициализация уже запущена');
    if (this.sessionInfo)
      throw new Error('Сессия уже инициализирована');

    this.updateStatus('preparing');
    const sessionInfo = await this.sendInitializeRequest();
    this.sessionInfo = sessionInfo;
    this.chunkSender = this.createChunkSender(new SequentialChunkSelector(this.sessionInfo.chunksCount));

    return sessionInfo.sessionId;
  }

  start() {
    if (!this.sessionInfo || !this.chunkSender) {
      throw new Error("Сессия не инициализирована!");
    }

    this.updateStatus('sending');

    this.chunkSender.start();
  }

  async cancelSending() {
    if (this.status !== 'sending' && this.status !== 'building')
      return;

    this.updateStatus('canceling');

    this.chunkSender?.cancelSending();

    await this.sendCancelRequest();
    this.updateStatus('cancel');
  }

  getStatus() {
    return this.status;
  }

  getPath() {
    if (!this.sessionInfo)
      throw new Error('Сначала нужно инициализировать сессию загрузки');
    return this.sessionInfo.path;
  }

  private createChunkSender(chunkSelector: ChunkSelectStrategy) {
    if (!this.sessionInfo)
      throw new Error('Сначала нужно инициализировать сессию загрузки');

    const chunkSender = new ChunkSender({
      file: this.file,
      requestsPerRun: 4,
      serverUrl: this.serverUrl,
      sessionInfo: this.sessionInfo,
      retriesCount: this.retriesCount,
      chunkSelector,
    });

    chunkSender.onChunkLoad = data => this.onChunkLoad && this.onChunkLoad(data);
    chunkSender.onComplete = () => this.startBuild();
    chunkSender.onError = () => {
      this.cancelSending();
      this.handleError("Ошибка загрузки файла");
    };

    return chunkSender;
  }

  private async sendInitializeRequest(): Promise<SessionIniResponse> {
    const errorHandler = (errorData: DefaultErrorBody) => {
      this.updateStatus('cancel');
      this.handleError(errorData.message);
    };

    const data = await this.apiClient<SessionIniResponse>({
      url: `${this.serverUrl}/upload/init`,
      options: {
        credentials: "include",
        method: "POST",
        body: JSON.stringify({
          fileName: this.file.name,
          fileSize: this.file.size,
          destinationDirId: this.destinationDirId,
        })
      },
      errorHandler,
    });

    return data;
  }

  private async sendCancelRequest() {
    const errorHandler = () => {
      this.handleError("Ошибка отмены запроса");
    };
    await this.apiClient({
      url: `${this.serverUrl}/upload/cancel/${this.sessionInfo!.sessionId}`,
      options: {
        credentials: "include",
        method: "DELETE",
      },
      errorHandler
    });
  }

  private async startBuild() {
    this.updateStatus('building');

    const errorHandler = () => {
      this.updateStatus('cancel');
      this.handleError("Не удалось собрать файл");
    };

    await this.apiClient({
      url: `${this.serverUrl}/upload/${this.sessionInfo!.sessionId}/build`,
      options: {
        credentials: "include",
        method: "POST",
      },
      errorHandler
    });

    this.startPolling();
  }

  private startPolling() {
    const interval = this.getPollingInterval();

    const intervalId = setInterval(async () => {
      const status = await this.checkFileBuildingStatus();

      if (status == "error") {
        clearInterval(intervalId);
        this.handleError("Не удалось собрать файл");
      }
      if (status == "complete") {
        clearInterval(intervalId);
        this.updateStatus('complete');
        this.onFileLoad && this.onFileLoad();
      }
    }, interval);
  }

  private async checkFileBuildingStatus() {
    const errorHandler = () => this.handleError("Не удалось собрать файл");

    const data = await this.apiClient<SessionCheckStatusResponse>(
      {
        url: this.serverUrl + `/upload/status/${this.sessionInfo!.sessionId}`,
        options: {
          credentials: 'include'
        },
        errorHandler
      });

    return data.status;
  }

  private getPollingInterval() {
    if (this.file.size < 500 * 1024 * 1024) {
      return 1 * 1000;
    } else if (this.file.size < 2 * 1024 * 1024 * 1024) {
      return 4 * 1000;
    } else {
      return 7 * 1000;
    }
  }

  private handleError(message: string): never {
    this.onError && this.onError(message);
    throw new Error();
  }

  private updateStatus(status: SendingStatus) {
    if (this.status == status) return;
    this.status = status;
    this.onStatusUpdate && this.onStatusUpdate(status);
  }
}