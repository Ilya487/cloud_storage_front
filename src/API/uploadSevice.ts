import apiRequest from "./apiRequest";
import { SERVER_URL } from "./config";
import type { UploadSessionStatus } from "./FileSender/FileSender";

export type RestoreUploadSessionResponse = {
    id: number;
} & (RestoreSuccess | RestoreError);

type RestoreSuccess = {
    res: true;
    chunksCount: number;
    readyChunks: number[];
    chunkSize: number;
    path: string;
    destinationDirId: number | 'root';
    status: UploadSessionStatus;
};

type RestoreError = {
    res: false;
};

export async function restoreSessionsInfo(ids: number[]): Promise<RestoreUploadSessionResponse[]> {
    const api = apiRequest();

    const res = await api<RestoreUploadSessionResponse[]>({
        url: SERVER_URL + "/upload/info?ids=" + ids.join(","),
        options: { credentials: "include" },
    });
    if (!res) return [];

    return res;
}

export async function cancelSessions(ids: number[]): Promise<CancelSessionRes[]> {
    const requests: Promise<CancelSessionRes>[] = [];
    ids.forEach(id => requests.push(cancelSession(id)));

    const requestResults = await Promise.all(requests);
    return requestResults;
}

export interface CancelSessionRes {
    id: number,
    res: boolean;
}
async function cancelSession(id: number): Promise<CancelSessionRes> {
    const api = apiRequest();
    const res = { id, res: true };
    try {
        await api<{}>({
            url: SERVER_URL + '/upload/cancel/' + id,
            options: { credentials: "include", method: 'DELETE' },
            errorHandler(errorData, response) {
                if (response.status == 404 || response.status == 400)
                    throw true;
                throw errorData;
            },
        });
    } catch (err) {
        if (err !== true)
            res.res = false;
    }
    finally {
        return res;
    }
}