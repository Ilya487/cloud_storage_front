import { SERVER_URL } from "./config";

export class FileSender {
  static STATUS_SENDING = "sending";
  static STATUS_CANCEL = "cancel";
  static STATUS_NOT_RUNNING = "notRunning";
  static STATUS_PREPARING = "preparing";
  static STATUS_COMPLETE = "complete";
  static STATUS_CANCELING = "canceling";
  #status = FileSender.STATUS_NOT_RUNNING;
  #file;
  #destinationDirId;
  #chunkSize;
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
    if (destinationDirId == "root") {
      this.#destinationDirId = "";
    } else this.#destinationDirId = destinationDirId;
  }

  async initialize() {
    this.#updateStatus(FileSender.STATUS_PREPARING);
    this.#currentChunk = 1;
    this.#availableThreads = 4;
    const { sessionId, chunkSize, chunkCount } =
      await this.#sendInitializeRequest();
    this.#sessionId = sessionId;
    this.#chunkSize = chunkSize;
    this.#chunkCount = chunkCount;
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
    if (this.#status !== FileSender.STATUS_SENDING) return;
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
    xhr.open("POST", `${this.serverUrl}/upload/chunk`);
    xhr.withCredentials = true;
    xhr.setRequestHeader("X-Session-Id", this.#sessionId);
    xhr.setRequestHeader("X-Chunk-Num", currentChunk);

    xhr.send(
      this.#file.slice(
        this.#chunkSize * (currentChunk - 1),
        this.#chunkSize * currentChunk
      )
    );
    this.#xhrMap.set(xhr, xhr);

    return new Promise((resolve, reject) => {
      xhr.onload = () => {
        this.#xhrMap.delete(xhr);
        if (xhr.status >= 200 && xhr.status < 300) {
          const result = JSON.parse(xhr.response);
          this.onChunkLoad && this.onChunkLoad(result);
          if (result["progress"] == 100) {
            this.#updateStatus(FileSender.STATUS_COMPLETE);
            this.onFileLoad && this.onFileLoad(result);
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
      this.onError && this.onError("Ошибка загрузки файла");
      throw new Error();
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
      this.onError && this.onError(data.message);
      throw new Error();
    }

    return {
      sessionId: data.sessionId,
      chunkSize: data.chunkSize,
      chunkCount: data.chunksCount,
    };
  }

  async #sendCancelRequest() {
    const response = await fetch(
      `${this.serverUrl}/upload/cancel?sessionId=${this.#sessionId}`,
      {
        credentials: "include",
        method: "DELETE",
      }
    );

    if (!response.ok) {
      this.onError && this.onError("Ошибка отмены запроса");
      throw new Error();
    }
  }

  #updateStatus(status) {
    if (this.#status == status) return;
    this.#status = status;
    this.onStatusUpdate && this.onStatusUpdate(status);
  }
}
