import { createContext, useContext, useEffect, useState } from "react";
import {
  FileSender,
  type SendingStatus,
  type TDestinationDirId,
} from "../API/FileSender/FileSender.ts";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { uploadsLocalStorageManager } from "../utils/uploadsLocalStorageManager.ts";
import type { UploadResumeData } from "../RestoreUploads/types.ts";
import { NewFileSender } from "../API/FileSender/NewFileSender.ts";
import { ResumeFileSender } from "../API/FileSender/ResumeFileSender.ts";

const UploadContext = createContext();

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

type UploadSession =
  | PreparingUploadSession
  | SendingUploadSession
  | BuildingUploadSession
  | CompletedUploadSession
  | CancelingUploadSession
  | CanceledUploadSession;

type ActiveUploadSesion = SendingUploadSession | BuildingUploadSession | CancelingUploadSession;

export const UploadProvider = ({ children }) => {
  const [activeUploads, setActiveUploads] = useState<ActiveUploadSesion[]>([]);
  const [preparingUploads, setPreparingUploads] = useState<PreparingUploadSession[]>([]);
  const [cancelUploads, setCancelUploads] = useState<CanceledUploadSession[]>([]);

  const [uploadSessions, setUploadSessions] = useState<UploadSession[]>([]);
  const queryClient = useQueryClient();
  const navigator = useNavigate();

  useEffect(() => {
    setActiveUploads(
      uploadSessions.filter(item => isUploadActive(item.status) || item.status == "complete"),
    );
    setPreparingUploads(uploadSessions.filter(item => item.status == "preparing"));
    setCancelUploads(uploadSessions.filter(item => item.status == "cancel"));
  }, [uploadSessions]);

  function addUploads(files: File[], destinationDirId: TDestinationDirId) {
    files.forEach(file => {
      if (file instanceof File) createUploadSession(file, destinationDirId);
    });
  }

  async function createUploadSession(file: File, destinationDirId: TDestinationDirId) {
    const fileSender = new NewFileSender({ file, destinationDirId, retriesCount: 2 });
    const generatedKey = file.name + Date.now();
    let sessionId: number | string;

    fileSender.onChunkLoad = ({ progress }) => {
      updateSessionProgress(+sessionId, progress);
    };

    fileSender.onFileLoad = () => {
      toast(`Файл "${file.name}" успешно загружен.`, {
        type: "success",
        position: "top-center",
        autoClose: 2500,
      });
      addReadySession(+sessionId);
      uploadsLocalStorageManager.deleteItem(+sessionId);
    };

    fileSender.onStatusUpdate = status => {
      if (status == "preparing") {
        addPreparingSession({
          id: generatedKey,
          file,
          status: "preparing",
          destinationDirId,
        });
      } else if (status == FileSender.STATUS_CANCEL && !sessionId) {
        updateSessionStatus(generatedKey, status);
      } else if (status == "cancel") {
        uploadsLocalStorageManager.deleteItem(+sessionId);
      } else if (status == FileSender.STATUS_BUILDING) {
        updateSessionStatus(sessionId, status);
      } else {
        deleteSession(generatedKey);
        updateSessionStatus(sessionId, status);
      }
    };

    fileSender.onError = message => {
      if (!sessionId) {
        cancelSession(generatedKey, message);
      } else cancelSession(sessionId, message);
    };

    fileSender.onSessionIni = (id, path) => {
      sessionId = id;
      uploadsLocalStorageManager.addItem(file, sessionId);

      addSendingUploadSession({
        id: sessionId,
        file,
        status: "sending",
        progress: 0,
        path,
        destinationDirId,
        cancelUpload: async () => {
          await fileSender.cancelSending();
          cancelSession(id, "Отменен");
          uploadsLocalStorageManager.deleteItem(id);
        },
      });
    };

    fileSender.start();
  }

  function resumeUploads(resumeData: UploadResumeData[]) {
    resumeData.forEach(v => createResumeFileSender(v));
  }

  function createResumeFileSender(resumeData: UploadResumeData) {
    const fileSender = new ResumeFileSender({ resumeData, retriesCount: 2 });

    fileSender.onChunkLoad = ({ progress }) => {
      updateSessionProgress(resumeData.id, progress);
    };

    fileSender.onFileLoad = () => {
      toast(`Файл "${resumeData.file.name}" успешно загружен.`, {
        type: "success",
        position: "top-center",
        autoClose: 2500,
      });
      addReadySession(resumeData.id);
      uploadsLocalStorageManager.deleteItem(resumeData.id);
    };

    fileSender.onStatusUpdate = status => {
      if (status == "cancel") {
        updateSessionStatus(resumeData.id, status);
        uploadsLocalStorageManager.deleteItem(resumeData.id);
      } else if (status == FileSender.STATUS_BUILDING) {
        updateSessionStatus(resumeData.id, status);
      } else {
        updateSessionStatus(resumeData.id, status);
      }
    };

    fileSender.onError = message => {
      cancelSession(resumeData.id, message);
    };

    addSendingUploadSession({
      id: resumeData.id,
      file: resumeData.file,
      status: "sending",
      path: resumeData.path,
      destinationDirId: resumeData.destinationDirId,
      progress: (resumeData.readyChunks.length / resumeData.chunksCount) * 100,
      cancelUpload: async () => {
        await fileSender.cancelSending();
        cancelSession(resumeData.id, "Отменен");
        uploadsLocalStorageManager.deleteItem(resumeData.id);
      },
    });

    fileSender.start();
  }

  function cancelSession(id: number | string, reason: string) {
    setUploadSessions(sessions => {
      return sessions.map(session => {
        if (session.id !== id) return session;

        const canceledSession = session as CanceledUploadSession;
        canceledSession.status = "cancel";
        canceledSession.reason = reason;
        canceledSession.restart = () => {
          deleteSession(canceledSession.id);
          createUploadSession(canceledSession.file, canceledSession.destinationDirId);
        };
        canceledSession.delete = () => {
          deleteSession(canceledSession.id);
        };

        return canceledSession;
      });
    });
  }

  function addSendingUploadSession(session: SendingUploadSession) {
    setUploadSessions(sessions => [...sessions, session]);
  }

  function addPreparingSession(session: PreparingUploadSession) {
    setUploadSessions(uploads => [...uploads, session]);
  }

  function updateSessionProgress(id: number, progress: number) {
    setUploadSessions(uploads =>
      uploads.map(session => {
        if (session.id == id && session.status == "sending") {
          session.progress = progress;
          return session;
        } else return session;
      }),
    );
  }

  function updateSessionStatus(id: number | string, newStatus: SendingStatus) {
    setUploadSessions(uploads =>
      uploads.map(session => {
        if (session.id != id) return session;
        session.status = newStatus;
        return session;
      }),
    );
  }

  function deleteSession(id: number | string) {
    setUploadSessions(sessions => sessions.filter(s => s.id !== id));
  }

  function addReadySession(sessionId: number) {
    setUploadSessions(uploads => {
      return uploads.map(session => {
        if (session.id !== sessionId) return session;
        const readySession = session as CompletedUploadSession;
        readySession.status == "complete";
        readySession.delete = () => deleteSession(readySession.id);
        readySession.readyAt = new Date();
        readySession.openDir = () => {
          navigator(`/catalog/${readySession.destinationDirId}`);
        };

        queryClient.invalidateQueries({
          queryKey: ["dir", +readySession.destinationDirId],
        });

        return readySession;
      });
    });
  }

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

  return (
    <UploadContext.Provider
      value={{
        addUploads,
        activeUploads,
        preparingUploads,
        cancelUploads,
        countOfActiveUpload: countNumberActiveUpload(),
        resumeUploads,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => useContext(UploadContext);
