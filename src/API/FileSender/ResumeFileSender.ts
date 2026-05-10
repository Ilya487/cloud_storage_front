import type { UploadResumeData } from "../../RestoreUploads/types";
import { ResumedChunkSelector } from "./ChunkSelectStrategy";
import { FileSender } from "./FileSender";

interface ResumeFileSenderConstruct {
    resumeData: UploadResumeData,
    retriesCount: number;
}

export class ResumeFileSender extends FileSender {
    private resumeData: UploadResumeData;

    constructor({ resumeData, retriesCount }: ResumeFileSenderConstruct) {
        super(resumeData.file, resumeData.destinationDirId, retriesCount);

        this.resumeData = resumeData;
        this.sessionInfo = {
            chunksCount: resumeData.chunksCount,
            chunkSize: resumeData.chunkSize,
            path: resumeData.path,
            sessionId: resumeData.id,
        };
    }

    start(): void {
        if (this.resumeData.status == 'uploading') {
            this.startChunkSending(this.sessionInfo, new ResumedChunkSelector(this.resumeData.readyChunks, this.resumeData.chunksCount));
        }
        else if (this.resumeData.status == "building") {
            this.startPolling();
        }
        else if (this.resumeData.status == 'complete') {
            this.handleCompleteUpload();
        }
        else if (this.resumeData.status == 'error' || this.resumeData.status == 'cancelled') {
            this.handleError('Не удалось собрать файл');
        }
    }
}