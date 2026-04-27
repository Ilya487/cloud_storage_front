import type { StoredUploadSession } from "../utils/uploadsLocalStorageManager";

export type UploadWithFile = {
    reason?: string;
    file?: File;
} & StoredUploadSession;

export interface MatchesResult {
    success: number;
    faild: number;
    sessionIdFileMap: Map<number, File>
}

export type UploadRestoringInfo = StoredUploadSession & { reason?: string };