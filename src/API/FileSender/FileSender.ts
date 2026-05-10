import apiRequest from "../apiRequest";
import { SERVER_URL } from "../config";
import { type ChunkSelectStrategy } from "./ChunkSelectStrategy";
import { ChunkSender, type ChunkUploadResponse } from "./ChunkSender";

type SendingStatus = 'sending' | 'cancel' | 'notRunning' | 'preparing' | 'complete' | 'canceling' | 'building';

export type UploadSessionStatus = 'building' | 'complete' | 'error' | 'uploading' | 'cancelled';
interface SessionCheckStatusResponse {
  status: UploadSessionStatus;
}

export interface SessionIniResponse {
  chunkSize: number;
  chunksCount: number;
  path: string;
  sessionId: number;
}

export abstract class FileSender {
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

  protected status: SendingStatus = 'notRunning';
  protected file: File;
  protected destinationDirId: number | "root";
  protected retriesCount: number;
  protected serverUrl: string = SERVER_URL;
  protected apiClient = apiRequest();
  protected sessionInfo!: SessionIniResponse;
  protected chunkSender!: ChunkSender;

  protected constructor(file: File, destinationDirId: number | 'root', retriesCount: number) {
    this.file = file;
    this.retriesCount = retriesCount;
    this.destinationDirId = destinationDirId;
    this.retriesCount = retriesCount;
  }

  abstract start(): void;

  async cancelSending() {
    if (this.status !== 'sending' || !this.sessionInfo)
      throw new Error('Невозможно отменить загрузку');

    this.updateStatus('canceling');

    this.chunkSender.cancelSending();

    await this.sendCancelRequest();
    this.updateStatus('cancel');
  }

  getStatus() {
    return this.status;
  }

  protected startChunkSending(sessionInfo: SessionIniResponse, chunkSelector: ChunkSelectStrategy) {
    this.chunkSender = new ChunkSender({
      file: this.file,
      requestsPerRun: 4,
      serverUrl: this.serverUrl,
      sessionInfo,
      retriesCount: this.retriesCount,
      chunkSelector,
    });

    this.chunkSender.onChunkLoad = data => this.onChunkLoad && this.onChunkLoad(data);
    this.chunkSender.onComplete = () => this.startBuild();
    this.chunkSender.onError = () => {
      this.cancelSending();
      this.handleError("Ошибка загрузки файла");
    };

    this.updateStatus('sending');
    this.chunkSender.start();
  }

  private async sendCancelRequest() {
    const errorHandler = () => {
      this.handleError("Ошибка отмены запроса");
    };
    await this.apiClient({
      url: `${this.serverUrl}/upload/cancel/${this.sessionInfo.sessionId}`,
      options: {
        credentials: "include",
        method: "DELETE",
      },
      errorHandler
    });
  }

  protected async startBuild() {
    this.updateStatus('building');

    const errorHandler = () => {
      this.updateStatus('cancel');
      this.handleError("Не удалось собрать файл");
    };

    await this.apiClient({
      url: `${this.serverUrl}/upload/${this.sessionInfo.sessionId}/build`,
      options: {
        credentials: "include",
        method: "POST",
      },
      errorHandler
    });

    this.startPolling();
  }

  protected startPolling() {
    this.updateStatus('building');
    const interval = this.getPollingInterval();

    const intervalId = setInterval(async () => {
      const status = await this.checkFileBuildingStatus();

      if (status == "error") {
        clearInterval(intervalId);
        this.handleError("Не удалось собрать файл");
      }
      if (status == "complete") {
        clearInterval(intervalId);
        this.handleCompleteUpload();
      }
    }, interval);
  }

  protected handleCompleteUpload() {
    this.updateStatus('complete');
    this.onFileLoad && this.onFileLoad();
  }

  private async checkFileBuildingStatus() {
    const errorHandler = () => this.handleError("Не удалось собрать файл");

    const data = await this.apiClient<SessionCheckStatusResponse>(
      {
        url: this.serverUrl + `/upload/status/${this.sessionInfo.sessionId}`,
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

  protected handleError(message: string): never {
    this.onError && this.onError(message);
    throw new Error();
  }

  protected updateStatus(status: SendingStatus) {
    if (this.status == status) return;
    this.status = status;
    this.onStatusUpdate && this.onStatusUpdate(status);
  }
}