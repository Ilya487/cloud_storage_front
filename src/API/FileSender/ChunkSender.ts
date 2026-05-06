import apiRequest from "../apiRequest";
import type { ChunkSelectStrategy } from "./ChunkSelectStrategy";
import type { SessionIniResponse } from "./FileSender";

export interface ChunkUploadResponse {
    progress: number;
}

interface ChunkSenderConstruct {
    sessionInfo: SessionIniResponse,
    requestsPerRun: number,
    file: File,
    serverUrl: string,
    chunkSelector: ChunkSelectStrategy;
    retriesCount?: number;
}

export class ChunkSender {
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
                headers: { 'X-Chunk-Num': String(chunkNum) },
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