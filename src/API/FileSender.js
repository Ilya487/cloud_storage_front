import { SERVER_URL } from "./config";

export class FileSender {
  static STATUS_SENDING = "sending";
  static STATUS_CANCEL = "cancel";
  static STATUS_NOT_RUNNING = "notRunning";
  static STATUS_PREPARING = "preparing";
  static STATUS_COMPLETE = "complete";
  static STATUS_CANCELING = "canceling";
  static STATUS_BUILDING = "building";
  #status = FileSender.STATUS_NOT_RUNNING;
  #file;
  #destinationDirId;
  #chunkSize;
  #path;
  onChunkLoad;
  onFileLoad;
  onStatusUpdate;
  onError;
  #chunkCount;
  #currentChunk;
  #xhrMap = new Map();
  #availableThreads;
  #retriesCount;
  #sessionId;

  constructor(file, destinationDirId = null, retriesCount = 2) {
    if (!(file instanceof File)) throw new Error("Передан не файл!");
    this.serverUrl = SERVER_URL;
    this.#file = file;
    this.#retriesCount = retriesCount;
    this.#destinationDirId = destinationDirId;
  }

  async initialize() {
    this.#updateStatus(FileSender.STATUS_PREPARING);
    this.#currentChunk = 1;
    this.#availableThreads = 4;
    const { sessionId, chunkSize, chunkCount, path } = await this.#sendInitializeRequest();
    this.#sessionId = sessionId;
    this.#chunkSize = chunkSize;
    this.#chunkCount = chunkCount;
    this.#path = path;
    return sessionId;
  }

  start() {
    if (!this.#sessionId) {
      throw new Error("Сессия не инициализирована!");
    }

    this.#updateStatus(FileSender.STATUS_SENDING);
    this.#sendGroupRequests();
  }

  async cancelSending() {
    if (this.#status !== FileSender.STATUS_SENDING && this.#status !== FileSender.STATUS_BUILDING)
      return;
    this.#updateStatus(FileSender.STATUS_CANCELING);
    for (let xhr of this.#xhrMap.keys()) {
      xhr.abort();
      this.#xhrMap.delete(xhr);
    }
    await this.#sendCancelRequest();
    this.#updateStatus(FileSender.STATUS_CANCEL);
  }

  getStatus() {
    return this.#status;
  }

  getPath() {
    return this.#path;
  }

  #sendGroupRequests() {
    if (this.#status == FileSender.STATUS_CANCEL) return;
    if (this.#availableThreads < 4) return;
    const tmp = this.#availableThreads;
    for (let i = 0; i < tmp; i++) {
      if (this.#currentChunk > this.#chunkCount) {
        return;
      }

      this.#sendChunkWithRetries(this.#currentChunk, this.#retriesCount);

      this.#currentChunk++;
      this.#availableThreads--;
    }
  }

  #sendChunk(currentChunk) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${this.serverUrl}/upload/chunk/${this.#sessionId}`);
    xhr.withCredentials = true;
    xhr.setRequestHeader("X-Chunk-Num", currentChunk);

    xhr.send(
      this.#file.slice(this.#chunkSize * (currentChunk - 1), this.#chunkSize * currentChunk),
    );
    this.#xhrMap.set(xhr, xhr);

    return new Promise((resolve, reject) => {
      xhr.onload = () => {
        this.#xhrMap.delete(xhr);
        if (xhr.status >= 200 && xhr.status < 300) {
          const result = JSON.parse(xhr.response);
          this.onChunkLoad && this.onChunkLoad(result);
          if (result["progress"] == 100) {
            this.#startBuild();
          }
          resolve();
        } else reject();
      };

      xhr.onerror = reject;
    });
  }

  #sendChunkWithRetries(chunkNum, retries) {
    if (retries > 0) {
      this.#sendChunk(chunkNum)
        .then(() => {
          this.#availableThreads++;
          this.#sendGroupRequests();
        })
        .catch(() => {
          this.#sendChunkWithRetries(chunkNum, retries - 1);
        });
    } else {
      this.cancelSending();
      this.#handleError("Ошибка загрузки файла");
    }
  }

  async #sendInitializeRequest() {
    const response = await fetch(`${this.serverUrl}/upload/init`, {
      credentials: "include",
      method: "POST",
      body: JSON.stringify({
        fileName: this.#file.name,
        fileSize: this.#file.size,
        destinationDirId: this.#destinationDirId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      this.#updateStatus(FileSender.STATUS_CANCEL);

      this.#handleError(data.message);
    }

    return {
      sessionId: data.sessionId,
      chunkSize: data.chunkSize,
      chunkCount: data.chunksCount,
      path: data.path,
    };
  }

  async #sendCancelRequest() {
    const response = await fetch(`${this.serverUrl}/upload/cancel/${this.#sessionId}`, {
      credentials: "include",
      method: "DELETE",
    });

    if (!response.ok) {
      this.#handleError("Ошибка отмены запроса");
    }
  }

  async #startBuild() {
    this.#updateStatus(FileSender.STATUS_BUILDING);

    const response = await fetch(this.serverUrl + `/upload/${this.#sessionId}/build`, {
      credentials: "include",
      method: "POST",
    });

    if (!response.ok) {
      this.#updateStatus(FileSender.STATUS_CANCEL);
      this.#handleError("Не удалось собрать файл");
    }

    this.#startPolling();
  }

  #startPolling() {
    const interval = this.#getPollingInterval();

    const intervalId = setInterval(async () => {
      const status = await this.#checkFileBuildingStatus();

      if (status == "error") {
        clearInterval(intervalId);
        this.#handleError("Не удалось собрать файл");
      }
      if (status == "complete") {
        clearInterval(intervalId);
        this.#updateStatus(FileSender.STATUS_COMPLETE);
        this.onFileLoad && this.onFileLoad();
      }
    }, interval);
  }

  async #checkFileBuildingStatus() {
    const response = await fetch(this.serverUrl + `/upload/status/${this.#sessionId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      this.#handleError("Не удалось собрать файл");
    }

    const data = await response.json();
    return data.status;
  }

  #getPollingInterval() {
    if (this.#file.size < 500 * 1024 * 1024) {
      return 1 * 1000;
    } else if (this.#file.size < 2 * 1024 * 1024 * 1024) {
      return 4 * 1000;
    } else {
      return 7 * 1000;
    }
  }

  #handleError(data) {
    this.onError && this.onError(data);
    throw new Error();
  }

  #updateStatus(status) {
    if (this.#status == status) return;
    this.#status = status;
    this.onStatusUpdate && this.onStatusUpdate(status);
  }
}
