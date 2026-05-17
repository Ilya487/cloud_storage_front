import type { StoredUploadSession } from "../utils/uploadsLocalStorageManager";
import type { MatchesResult } from "./types";

function matchFilesWithSessions(files: File[], uploads: StoredUploadSession[]): MatchesResult {
    const res: MatchesResult = { faild: 0, success: 0, sessionIdFileMap: new Map() };

    uploads.forEach(session => {
        const matchRes = files.find(
            file =>
                session.fileInfo.lastModified == file.lastModified &&
                session.fileInfo.name == file.name &&
                session.fileInfo.size == file.size,
        );

        if (matchRes) {
            res.success++;
            res.sessionIdFileMap.set(session.sessionId, matchRes)
        } else
            res.faild++;
    });

    return res;
}

export default matchFilesWithSessions;