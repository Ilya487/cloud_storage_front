import {
    uploadsLocalStorageManager,
} from "../utils/uploadsLocalStorageManager.js";
import {
    restoreSessionsInfo,
    cancelSessions as cancelSessionsRequest,
    type RestoreUploadSessionResponse,
    type CancelSessionRes,
} from "../API/uploadSevice.js";
import { action, createMachine, guard, immediate, invoke, reduce, state, transition } from "robot3";
import matchFilesWithSessions from "./matchFilesWithSessions.js";
import type { MatchesResult, UploadRestoringInfo } from "./types.js";

const events = ["finish", "exit", "selectFiles", "back", "continue", "confirm", "cancel"] as const;
export type MachineEvent = (typeof events)[number];

type Context = {
    uploadsList: UploadRestoringInfo[];
    selectedFiles: File[];
    matchResult?: MatchesResult;
    restoreResponse: RestoreUploadSessionResponse[];
    unrestoredUploads: UploadRestoringInfo[];
    cancelResponse: CancelSessionRes[];
    dataForResumeUpload: UploadResumeData[];
    sessionsForCancel: number[];
};

export type SelectFilesEvent = {
    type: "selectFiles";
    files: File[];
};

type DoneRestoreRequestEvent = {
    type: "done";
    data: RestoreUploadSessionResponse[];
};

type DoneCancelSessionsRequestEvent = {
    type: "done";
    data: CancelSessionRes[];
};

const context = (): Context => ({
    uploadsList: uploadsLocalStorageManager.getUploads(),
    selectedFiles: [],
    unrestoredUploads: [],
    cancelResponse: [],
    restoreResponse: [],
});

const selectFilesTransition = () =>
    transition(
        "selectFiles",
        "selectingFiles",
        reduce<Context, SelectFilesEvent>((ctx, ev) => ({ ...ctx, selectedFiles: ev.files })),
        reduce<Context, SelectFilesEvent>((ctx, ev) => {
            return { ...ctx, matchResult: matchFilesWithSessions(ev.files, ctx.uploadsList) };
        }),
        reduce<Context, unknown>(ctx => {
            const updatedUploads = ctx.uploadsList.map(upload => {
                if (ctx.matchResult!.sessionIdFileMap.has(upload.sessionId)) {
                    upload.reason = undefined;
                    return upload;
                } else {
                    upload.reason = "Выбран неверный файл, или он был изменен после начала загрузки";
                    return upload;
                }
            });

            return { ...ctx, uploadsList: updatedUploads };
        }),
    );

export const restoringSessionsStateMachine = createMachine(
    {
        start: state(
            immediate(
                "selectingFiles",
                guard<Context, unknown>(ctx => ctx.selectedFiles.length > 0),
            ),
            transition(
                "exit",
                "exit",
                guard<Context, unknown>(ctx => ctx.uploadsList.length == 0),
            ),
            transition("cancel", "confirmingExit"),
            selectFilesTransition(),
        ),
        selectingFiles: state(
            immediate(
                "loadingSessionsInfo",
                guard<Context, unknown>(ctx => ctx.matchResult?.faild == 0),
            ),
            transition("cancel", "confirmingExit"),
            selectFilesTransition(),
            transition("continue", "confirmingContinue"),
        ),
        confirmingExit: state(transition("exit", "cancelingSessions"), transition("back", "start")),
        confirmingContinue: state(
            transition("back", "start"),
            transition("confirm", "loadingSessionsInfo"),
        ),
        loadingSessionsInfo: invoke(
            requestSessionsInfo,
            transition(
                "done",
                "handlingRestoreResult",
                reduce<Context, DoneRestoreRequestEvent>((ctx, ev) => ({
                    ...ctx,
                    restoreResponse: ev.data,
                })),
                reduce<Context, unknown>(ctx => {
                    const hasError = ctx.restoreResponse?.some(r => r.res == false);
                    if (!hasError) return ctx;

                    const unrestoredUploads: UploadRestoringInfo[] = [];

                    ctx.restoreResponse!.forEach(r => {
                        if (r.res) return;
                        const upload = ctx.uploadsList.find(u => u.sessionId == r.id);
                        if (!upload) throw new Error("Рассинхронизация данных");
                        unrestoredUploads.push({ ...upload, reason: "Не удалось восстановить сессию" });
                    });

                    return { ...ctx, unrestoredUploads: unrestoredUploads };
                }),
            ),
            transition(
                "error",
                "exit",
                action(() => alert("EROR")),
            ),
        ),
        handlingRestoreResult: state(
            immediate(
                "finishing",
                guard<Context, unknown>(ctx => ctx.unrestoredUploads.length == 0),
            ),
            transition("confirm", "cancelingSessions"),
        ),
        cancelingSessions: invoke(
            cancelSessions,
            transition(
                "done",
                "finishing",
                reduce<Context, DoneCancelSessionsRequestEvent>((ctx, ev) => ({
                    ...ctx,
                    cancelResponse: ev.data,
                })),
                action<Context, unknown>(ctx =>
                    ctx.cancelResponse.forEach(
                        res => res.res && uploadsLocalStorageManager.deleteItem(res.id),
                    ),
                ),
            ),
        ),
        finishing: state(
            immediate(
                "exit",
                reduce<Context, unknown>(ctx => {
                    const successRestore = ctx.restoreResponse.filter(r => r.res);
                    if (successRestore.length == 0) {
                        return ctx;
                    }

                    const dataForResumeUpload: UploadResumeData[] = successRestore.map(val => {
                        return { ...val, file: ctx.matchResult?.sessionIdFileMap.get(val.id) as File };
                    });
                    return { ...ctx, dataForResumeUpload };
                }),
            ),
        ),
        exit: state(),
    },
    context,
);

async function requestSessionsInfo(ctx: Context) {
    const ids: number[] = [...ctx.matchResult!.sessionIdFileMap.keys()];

    const res = await restoreSessionsInfo(ids);
    return res;
}

async function cancelSessions(ctx: Context) {
    const ids = getSessionsIdsForCancel(ctx);
    const res = await cancelSessionsRequest(ids);
    return res;
}

function getSessionsIdsForCancel(ctx: Context): number[] {
    let ids: number[] = [];
    if (ctx.unrestoredUploads.length != 0) {
        ids = ctx.unrestoredUploads.map(u => u.sessionId);
    } else {
        ids = ctx.uploadsList.map(u => u.sessionId);
    }

    return ids;
}