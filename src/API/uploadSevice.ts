import { useMutation } from "@tanstack/react-query";
import apiRequest from "./apiRequest";
import { SERVER_URL } from "./config";

type RestoreUploadSessionResponse = {
    id: number;
} & (RestoreSuccess | RestoreError);

type RestoreSuccess = {
    res: true;
    chunksCount: number;
    readyChunks: number[];
};

type RestoreError = {
    res: false;
};

async function restoreSessionsInfo(ids: number[]): Promise<RestoreUploadSessionResponse[]> {
    const api = apiRequest();

    await new Promise(resolve => {
        setTimeout(resolve, 1000);
    });

    const res = await api<RestoreUploadSessionResponse[]>({
        url: SERVER_URL + "/upload/info?ids=" + ids.join(","),
        options: { credentials: "include" },
    });
    if (!res) return [];

    return res;
}

async function cancelSessions(ids: number[]): Promise<CancelSessionRes[]> {
    const requests: Promise<CancelSessionRes>[] = [];
    ids.forEach(id => requests.push(cancelSession(id)))

    await new Promise(resolve => {
        setTimeout(resolve, 1000);
    });

    const requestResults = await Promise.all(requests)
    return requestResults;
}

interface CancelSessionRes {
    id: number,
    res: boolean
}
async function cancelSession(id: number): Promise<CancelSessionRes> {
    const api = apiRequest();
    const res = { id, res: true }
    try {
        await api<{}>({
            url: SERVER_URL + '/upload/cancel/' + id,
            options: { credentials: "include", method: 'DELETE' },
            errorHandler(_, response) {
                if (response.status == 404)
                    res.res = true
                else res.res = false
            },
        })
    } catch (err) {
        res.res = false
    }
    finally {
        return res
    }
}

export function useRestoreSessionsInfo() {
    return useMutation({
        mutationFn: restoreSessionsInfo,
    });
}

export function useCancelUploadSessions() {
    return useMutation({
        mutationFn: cancelSessions,
    });
}
