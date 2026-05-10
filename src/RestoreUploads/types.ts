import type { RestoreUploadSessionResponse } from "../API/uploadSevice";
import type { StoredUploadSession } from "../utils/uploadsLocalStorageManager";

export type UploadWithFile = {
    reason?: string;
    file?: File;
} & StoredUploadSession;

export interface MatchesResult {
    success: number;
    faild: number;
    sessionIdFileMap: Map<number, File>;
}

export type UploadRestoringInfo = StoredUploadSession & { reason?: string; };

export type UploadResumeData = Omit<
    Extract<RestoreUploadSessionResponse, { res: true; }>,
    'res'
> & { file: File; };