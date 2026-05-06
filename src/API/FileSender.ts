import apiRequest, { type DefaultErrorBody } from "./apiRequest";
import { SERVER_URL } from "./config";

type SendingStatus = 'sending' | 'cancel' | 'notRunning' | 'preparing' | 'complete' | 'canceling' | 'building';
interface ChunkUploadResponse {
  progress: number;
}
interface SessionIniResponse {
  chunkSize: number;
  chunksCount: number;
  path: string;
  sessionId: number;
}

interface SessionCheckStatusResponse {
  status: 'building' | 'complete' | 'error' | 'uploading' | 'cancelled';
}

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
  private file;
  private destinationDirId: number | null;
  private retriesCount: number;
  private serverUrl: string;
  private apiClient = apiRequest();
  private sessionInfo?: SessionIniResponse;
  private chunkSender?: ChunkSender;

  constructor(file: File, destinationDirId: null | number = null, retriesCount: number = 2) {
    if (!(file instanceof File)) throw new Error("Передан не файл!");
    this.serverUrl = SERVER_URL;
    this.file = file;
    this.retriesCount = retriesCount;
    this.destinationDirId = destinationDirId;
  }

  async initialize() {
    this.updateStatus('preparing');
    const sessionInfo = await this.sendInitializeRequest();
    this.sessionInfo = sessionInfo;

    return sessionInfo.sessionId;
  }

  start() {
    if (!this.sessionInfo) {
      throw new Error("Сессия не инициализирована!");
    }

    this.updateStatus('sending');

    const chunkSender = new ChunkSender({
      file: this.file,
      requestsPerRun: 4,
      serverUrl: this.serverUrl,
      sessionInfo: this.sessionInfo,
      retriesCount: this.retriesCount,
      chunkSelector: new SequentialChunkSelector(this.sessionInfo.chunksCount)
    });
    this.chunkSender = chunkSender;

    chunkSender.onChunkLoad = data => this.onChunkLoad && this.onChunkLoad(data);
    chunkSender.onComplete = () => this.startBuild();
    chunkSender.onError = () => {
      this.cancelSending();
      this.handleError("Ошибка загрузки файла");
    };
    chunkSender.start();
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
    return this.sessionInfo.path;
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
      url: `${this.serverUrl}/upload/cancel/${this.sessionInfo.sessionId}`,
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
      url: `${this.serverUrl}/upload/${this.sessionInfo.sessionId}/build`,
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

interface ChunkSenderConstruct {
  sessionInfo: SessionIniResponse,
  requestsPerRun: number,
  file: File,
  serverUrl: string,
  chunkSelector: ChunkSelectStrategy;
  retriesCount?: number;
}

class ChunkSender {
  public onChunkLoad?: (data: ChunkUploadResponse) => void;
  public onComplete?: () => void;
  public onError?: () => void;

  private file: File;
  private abortControllers = new Set<AbortController>();
  private requestsPerRun: number;
  private retriesCount: number;
  private serverUrl: string;
  private sessionInfo: SessionIniResponse;
  private apiClient = apiRequest();
  private availableRequests: number;
  private isCancel = false;
  private chunkSelector: ChunkSelectStrategy;

  constructor({ sessionInfo, requestsPerRun, file, serverUrl, chunkSelector, retriesCount = 1 }: ChunkSenderConstruct) {
    this.serverUrl = serverUrl;
    this.file = file;
    this.requestsPerRun = requestsPerRun;
    this.availableRequests = requestsPerRun;
    this.serverUrl = serverUrl;
    this.sessionInfo = sessionInfo;
    this.retriesCount = retriesCount;
    this.chunkSelector = chunkSelector;
  }

  start() {
    if (!this.chunkSelector.hasNext()) {
      this.onComplete && this.onComplete();
    }
    else
      this.sendGroupRequests();
  }

  cancelSending() {
    this.isCancel = true;
    for (let abortController of this.abortControllers.keys()) {
      abortController.abort();
      this.abortControllers.delete(abortController);
    }
  }

  private sendGroupRequests() {
    if (this.isCancel) return;
    if (this.availableRequests < this.requestsPerRun) return;
    const tmp = this.availableRequests;
    for (let i = 0; i < tmp; i++) {
      const nextChunk = this.chunkSelector.next();
      if (!nextChunk) return;

      this.sendChunkWithRetries(nextChunk, this.retriesCount).then(() => {
        this.availableRequests++;
        this.sendGroupRequests();
      });

      this.availableRequests--;
    }
  }

  private async sendChunkWithRetries(chunkNum: number, retries: number) {
    if (retries == 0) {
      this.onError?.();
      return;
    }

    try {
      const data = await this.sendChunk(chunkNum);
      this.onChunkLoad && this.onChunkLoad(data);
      if (data.progress == 100) {
        this.onComplete && this.onComplete();
      }

    } catch (error) {
      if (error instanceof Error && error.name == 'AbortError')
        return;
      this.sendChunkWithRetries(chunkNum, retries - 1);
    }
  }

  private async sendChunk(chunkNum: number) {
    const abortController = new AbortController();
    this.abortControllers.add(abortController);

    const data = await this.apiClient<ChunkUploadResponse>({
      url: `${this.serverUrl}/upload/chunk/${this.sessionInfo.sessionId}`,
      options: {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-Chunk-Num': chunkNum },
        body: this.cutChunkFromFile(this.file, chunkNum, this.sessionInfo.chunkSize),
        signal: abortController.signal
      },
    });

    this.abortControllers.delete(abortController);
    return data;
  }

  private cutChunkFromFile(file: File, chunkNum: number, chunkSize: number) {
    return file.slice(chunkSize * (chunkNum - 1), chunkSize * chunkNum);
  }
}

interface ChunkSelectStrategy {
  next: () => number | false;
  hasNext: () => boolean;
}

class SequentialChunkSelector implements ChunkSelectStrategy {
  private current: number = 1;
  private total: number;

  constructor(total: number) {
    this.total = total;
  }

  next(): number | false {
    const next = this.current++;
    if (next > this.total) return false;
    return next;
  }

  hasNext() {
    if (this.current > this.total) return false;
    else return true;
  }
}

class ResumedChunkSelector implements ChunkSelectStrategy {
  private notReadyChunks: number[];
  private currentIndex: number = 0;

  constructor(readyChunks: number[], chunksCount: number) {
    this.notReadyChunks = this.getNotReadyChunks(readyChunks, chunksCount);
  }

  next() {
    const nextIndex = this.currentIndex++;
    if (nextIndex >= this.notReadyChunks.length) return false;
    else return this.notReadyChunks[nextIndex];
  }

  hasNext() {
    if (this.currentIndex >= this.notReadyChunks.length) return false;
    else return true;
  }

  private getNotReadyChunks(readyChunks: number[], chunksCount: number): number[] {
    const ready = new Set(readyChunks);

    const needSend = [];
    for (let i = 1; i <= chunksCount; i++) {
      if (!ready.has(i)) needSend.push(i);
    }

    return needSend;
  }
}