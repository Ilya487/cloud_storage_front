import { useState } from "react";
import type { SendingStatus, TDestinationDirId } from "../API/FileSender/FileSender";

interface BaseUploadSession {
    id: number | string;
    file: File;
    destinationDirId: TDestinationDirId;
    status: SendingStatus;
}

interface PreparingUploadSession extends BaseUploadSession {
    id: string;
    status: "preparing";
}

interface SendingUploadSession extends BaseUploadSession {
    status: "sending";
    path: string;
    progress: number;
    cancelUpload: () => void;
}

interface BuildingUploadSession extends BaseUploadSession {
    status: "building";
    path: string;
}

interface CompletedUploadSession extends BaseUploadSession {
    status: "complete";
    path: string;
    readyAt: Date;
    delete: () => void;
    openDir: () => void;
}

interface CancelingUploadSession extends BaseUploadSession {
    status: "canceling";
    path: string;
}

interface CanceledUploadSession extends BaseUploadSession {
    status: "cancel";
    reason: string;
    restart: () => void;
    delete: () => void;
}

export type UploadSession =
    | PreparingUploadSession
    | SendingUploadSession
    | BuildingUploadSession
    | CompletedUploadSession
    | CancelingUploadSession
    | CanceledUploadSession;

const useUploadSessions = () => {
    const [uploadSessions, setUploadSessions] = useState<UploadSession[]>([]);

    const sessionsManager = {
        cancelSession({
            id,
            reason,
            onDelete,
            onRestart,
        }: {
            id: number | string;
            reason: string;
            onRestart: CanceledUploadSession["restart"];
            onDelete: CanceledUploadSession["delete"];
        }) {
            setUploadSessions(sessions => {
                return sessions.map(session => {
                    if (session.id !== id) return session;

                    const canceledSession = { ...session } as CanceledUploadSession;
                    canceledSession.status = "cancel";
                    canceledSession.reason = reason;
                    canceledSession.restart = onRestart;
                    canceledSession.delete = onDelete;

                    return canceledSession;
                });
            });
        },

        addSendingUploadSession(session: SendingUploadSession) {
            setUploadSessions(sessions => [...sessions, session]);
        },

        addPreparingSession(session: PreparingUploadSession) {
            setUploadSessions(uploads => [...uploads, session]);
        },

        updateSessionProgress(id: number, progress: number) {
            setUploadSessions(uploads =>
                uploads.map(session => {
                    if (session.id == id && session.status == "sending") {
                        return { ...session, progress };
                    } else return session;
                }),
            );
        },

        updateSessionStatus(id: number | string, newStatus: SendingStatus) {
            setUploadSessions(uploads =>
                uploads.map(session => {
                    if (session.id != id) return session;
                    return { ...session, status: newStatus } as Extract<UploadSession, typeof newStatus>;
                }),
            );
        },

        deleteSession(id: number | string) {
            setUploadSessions(sessions => sessions.filter(s => s.id !== id));
        },

        addReadySession({
            sessionId,
            onDelete,
            onOpenDir,
        }: {
            sessionId: number;
            onDelete: CompletedUploadSession["delete"];
            onOpenDir: CompletedUploadSession["openDir"];
        }) {
            setUploadSessions(uploads => {
                return uploads.map(session => {
                    if (session.id !== sessionId) return session;

                    const readySession = session as CompletedUploadSession;
                    readySession.status = "complete";
                    readySession.delete = onDelete;
                    readySession.readyAt = new Date();
                    readySession.openDir = onOpenDir;

                    return readySession;
                });
            });
        },

    };
    function countNumberActiveUpload() {
        const activeCount = uploadSessions.reduce((acc, item) => {
            if (isUploadActive(item.status)) return ++acc;
            else return acc;
        }, 0);

        return activeCount;
    }

    function isUploadActive(status: SendingStatus) {
        return (
            status == "building" || status == "canceling" || status == "preparing" || status == "sending"
        );
    }


    return { uploadSessions, sessionsManager, countOfActiveUpload: countNumberActiveUpload() };
};

export default useUploadSessions;