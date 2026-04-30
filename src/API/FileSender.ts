import apiRequest, { type DefaultErrorBody } from "./apiRequest";
import { SERVER_URL } from "./config";

type SendingStatus = 'sending' | 'cancel' | 'notRunning' | 'preparing' | 'complete' | 'canceling' | 'building'
interface ChunkUploadResponse {
  progress: number
}
interface SessionIniResponse {
  chunkSize: number
  chunksCount: number
  path: string
  sessionId: number
}

interface SessionCheckStatusResponse {
  status: 'building' | 'complete' | 'error' | 'uploading' | 'cancelled'
}

export class FileSender {
  static STATUS_SENDING = "sending";
  static STATUS_CANCEL = "cancel";
  static STATUS_NOT_RUNNING = "notRunning";
  static STATUS_PREPARING = "preparing";
  static STATUS_COMPLETE = "complete";
  static STATUS_CANCELING = "canceling";
  static STATUS_BUILDING = "building";
  private status: SendingStatus = 'notRunning';
  private file;
  private destinationDirId: number | null;
  private chunkSize?: number;
  private path?: string;
  private onChunkLoad;
  private onFileLoad;
  private onStatusUpdate?: (status: SendingStatus) => void;
  private onError;
  private chunkCount?: number;
  private currentChunk?: number;
  private abortControllers = new Set<AbortController>();
  private availableThreads: number;
  private retriesCount: number;
  private sessionId?: number;
  private serverUrl: string;
  private apiClient = apiRequest()

  constructor(file: File, destinationDirId: null | number = null, retriesCount: number = 2) {
    if (!(file instanceof File)) throw new Error("Передан не файл!");
    this.serverUrl = SERVER_URL;
    this.file = file;
    this.retriesCount = retriesCount;
    this.destinationDirId = destinationDirId;
  }

  async initialize() {
    this.updateStatus('preparing');
    this.currentChunk = 1;
    this.availableThreads = 4;

    const sessionInfo = await this.sendInitializeRequest();
    this.sessionId = sessionInfo.sessionId;
    this.chunkSize = sessionInfo.chunkSize;
    this.chunkCount = sessionInfo.chunksCount;
    this.path = sessionInfo.path;
    return sessionInfo.sessionId;
  }

  start() {
    if (!this.sessionId) {
      throw new Error("Сессия не инициализирована!");
    }

    this.updateStatus('sending');
    this.sendGroupRequests();
  }

  async cancelSending() {
    if (this.status !== 'sending' && this.status !== 'building')
      return;
    this.updateStatus('canceling');
    for (let abortController of this.abortControllers.keys()) {
      abortController.abort();
      this.abortControllers.delete(abortController);
    }
    await this.sendCancelRequest();
    this.updateStatus('cancel');
  }

  getStatus() {
    return this.status;
  }

  getPath() {
    return this.path;
  }

  private sendGroupRequests() {
    if (this.status == 'cancel') return;
    if (this.availableThreads < 4) return;
    const tmp = this.availableThreads;
    for (let i = 0; i < tmp; i++) {
      if (this.currentChunk > this.chunkCount) {
        return;
      }

      this.sendChunkWithRetries(this.currentChunk, this.retriesCount);

      this.currentChunk++;
      this.availableThreads--;
    }
  }

  private async sendChunk(currentChunk: number) {
    const abortController = new AbortController();
    this.abortControllers.add(abortController);

    const data = await this.apiClient<ChunkUploadResponse>({
      url: `${this.serverUrl}/upload/chunk/${this.sessionId}`,
      options: {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-Chunk-Num': currentChunk },
        body: cutChunkFromFile(this.file, currentChunk, this.chunkSize),
        signal: abortController.signal
      },
    })

    this.abortControllers.delete(abortController)
    this.onChunkLoad && this.onChunkLoad(data);
    if (data!.progress == 100) {
      this.startBuild();
    }
  }

  private sendChunkWithRetries(chunkNum, retries) {
    if (retries > 0) {
      this.sendChunk(chunkNum)
        .then(() => {
          this.availableThreads++;
          this.sendGroupRequests();
        })
        .catch((err) => {
          if (err.name == 'AbortError') return;
          this.sendChunkWithRetries(chunkNum, retries - 1);
        });
    } else {
      this.cancelSending();
      this.handleError("Ошибка загрузки файла");
    }
  }

  private async sendInitializeRequest(): Promise<SessionIniResponse> {
    const errorHandler = (errorData: DefaultErrorBody) => {
      this.updateStatus('cancel');
      this.handleError(errorData.message);
    }

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
    }
    await this.apiClient({
      url: `${this.serverUrl}/upload/cancel/${this.sessionId}`,
      options: {
        credentials: "include",
        method: "DELETE",
      },
      errorHandler
    })
  }

  private async startBuild() {
    this.updateStatus('building');

    const errorHandler = () => {
      this.updateStatus('cancel');
      this.handleError("Не удалось собрать файл");
    }

    await this.apiClient({
      url: `${this.serverUrl}/upload/${this.sessionId}/build`,
      options: {
        credentials: "include",
        method: "POST",
      },
      errorHandler
    })

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
        url: this.serverUrl + `/upload/status/${this.sessionId}`,
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

  private handleError(data): never {
    this.onError && this.onError(data);
    throw new Error();
  }

  private updateStatus(status: SendingStatus) {
    if (this.status == status) return;
    this.status = status;
    this.onStatusUpdate && this.onStatusUpdate(status);
  }
}

function cutChunkFromFile(file: File, chunkNum: number, chunkSize: number) {
  return file.slice(chunkSize * (chunkNum - 1), chunkSize * chunkNum)
}