import { SERVER_URL } from "./config";

export class FileSender {
  static STATUS_SENDING = "sending";
  static STATUS_CANCEL = "cancel";
  static STATUS_NOT_RUNNING = "notRunning";
  static STATUS_COMPLETE = "complete";
  static STATUS_CANCELING = "canceling";
  #status = FileSender.STATUS_NOT_RUNNING;
  #file;
  #chunkSize;
  onChunkLoad;
  onFileLoad;
  onStatusUpdate;
  #chunkCount;
  #currentChunk;
  #xhrMap = new Map();
  #availableThreads;
  #retriesCount;
  #sessionId;

  constructor(file, retriesCount = 2) {
    if (!(file instanceof File)) throw new Error("Передан не файл!");
    this.serverUrl = SERVER_URL;
    this.#file = file;
    this.#retriesCount = retriesCount;
  }

  async startSending() {
    this.#updateStatus(FileSender.STATUS_SENDING);
    this.#currentChunk = 1;
    this.#availableThreads = 4;
    const { sessionId, chunkSize, chunkCount } =
      await this.#sendInitializeRequest();
    this.#sessionId = sessionId;
    this.#chunkSize = chunkSize;
    this.#chunkCount = chunkCount;
    this.#sendGroupRequests();

    return sessionId;
  }

  async cancelSending() {
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
        this.#updateStatus(FileSender.STATUS_COMPLETE);
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
          if (result["progress"] == 100)
            this.onFileLoad && this.onFileLoad(result);
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
          console.log("Этот чанк не загрузился " + chunkNum);

          this.#sendChunkWithRetries(chunkNum, retries - 1);
        });
    } else {
      this.cancelSending();
      throw new Error("Ошибка загрузки файла");
    }
  }

  async #sendInitializeRequest() {
    const response = await fetch(`${this.serverUrl}/upload/init`, {
      credentials: "include",
      method: "POST",
      body: JSON.stringify({
        fileName: this.#file.name,
        fileSize: this.#file.size,
        destinationDirId: "",
      }),
    });

    const data = await response.json();
    return {
      sessionId: data.sessionId,
      chunkSize: data.chunkSize,
      chunkCount: data.chunksCount,
    };
  }

  #sendCancelRequest() {
    return fetch(
      `${this.serverUrl}/upload/cancel?sessionId=${this.#sessionId}`,
      {
        credentials: "include",
        method: "DELETE",
      }
    );
  }

  #updateStatus(status) {
    this.#status = status;
    this.onStatusUpdate(status);
  }
}
