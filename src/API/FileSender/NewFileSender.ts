import type { DefaultErrorBody } from "../apiRequest";
import { SequentialChunkSelector } from "./ChunkSelectStrategy";
import { FileSender, type SessionIniResponse } from "./FileSender";

interface NewFileSenderConstruct {
    file: File,
    destinationDirId: number | 'root';
    retriesCount: number;
}

export class NewFileSender extends FileSender {
    public onSessionIni?: (sessionId: number, filePath: string) => void;

    constructor(params: NewFileSenderConstruct) {
        super(params.file, params.destinationDirId, params.retriesCount);
    }

    async start() {
        const sessionInfo = await this.initialize();
        this.sessionInfo = sessionInfo;

        this.startChunkSending(sessionInfo, new SequentialChunkSelector(this.sessionInfo.chunksCount));
    }

    private async initialize() {
        this.updateStatus('preparing');
        const sessionInfo = await this.sendInitializeRequest();
        this.onSessionIni?.(sessionInfo.sessionId, sessionInfo.path);

        return sessionInfo;
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
}