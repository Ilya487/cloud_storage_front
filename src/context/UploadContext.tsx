import { createContext, useContext, useEffect, useState } from "react";
import { FileSender } from "../API/FileSender/FileSender.ts";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { uploadsLocalStorageManager } from "../utils/uploadsLocalStorageManager.ts";
import type { UploadResumeData } from "../RestoreUploads/types.ts";

const UploadContext = createContext();

export const UploadProvider = ({ children }) => {
  const [activeUploads, setActiveUploads] = useState([]);
  const [preparingUploads, setPreparingUploads] = useState([]);
  const [cancelUploads, setCancelUploads] = useState([]);
  const queryClient = useQueryClient();
  const navigator = useNavigate();

  function addUploads(files: File[], destinationDirId: number | "root") {
    if (activeUploads.size == 3) return;
    files.forEach(file => {
      if (file instanceof File) createUploadSession(file, destinationDirId);
    });
  }

  async function createUploadSession(file: File, destinationDirId: number | "root") {
    const fileSender = new FileSender({ file, destinationDirId, retriesCount: 2 });
    const generatedKey = file.name + Date.now();
    let sessionId: number | string;

    fileSender.onChunkLoad = ({ progress }) => {
      updateSessionProgress(sessionId, progress);
    };

    fileSender.onFileLoad = () => {
      toast(`Файл "${file.name}" успешно загружен.`, {
        type: "success",
        position: "top-center",
        autoClose: 2500,
      });
      addReadySession(sessionId);
      uploadsLocalStorageManager.deleteItem(sessionId);
    };

    fileSender.onStatusUpdate = status => {
      if (status == FileSender.STATUS_PREPARING) {
        addPreparingSession({
          id: generatedKey,
          file,
          status,
          destinationDirId,
        });
      } else if (status == FileSender.STATUS_CANCEL && !sessionId) {
        updatePreparingSessionStatus(generatedKey, status);
      } else if (status == "cancel") {
        uploadsLocalStorageManager.deleteItem(sessionId);
      } else if (status == FileSender.STATUS_BUILDING) {
        updateSessionStatus(sessionId, status);
      } else {
        deletePreparingSession(generatedKey);
        updateSessionStatus(sessionId, status);
      }
    };

    fileSender.onError = message => {
      if (!sessionId) {
        cancelPreparingSession(generatedKey, message);
      } else cancelActiveSession(sessionId, message);
    };

    fileSender.onSessionIni = (id, path) => {
      sessionId = id;
      uploadsLocalStorageManager.addItem(file, sessionId);

      addUploadSession({
        id: sessionId,
        file,
        status: fileSender.getStatus(),
        path,
        destinationDirId,
        cancelUpload: async () => {
          await fileSender.cancelSending();
          cancelActiveSession(sessionId, "Отменен");
          uploadsLocalStorageManager.deleteItem(sessionId);
        },
      });
    };

    fileSender.start();
  }

  function resumeUploads(resumeData: UploadResumeData[]) {
    // TODO
    // resumeData.forEach(v => createResumeFileSender(v));
  }

  function cancelActiveSession(id, reason) {
    setActiveUploads(currentActiveUploads => {
      const canceledSession = currentActiveUploads.find(session => session.id == id);
      addCancelSession(canceledSession, reason);

      return currentActiveUploads.filter(session => session.id !== id);
    });
  }

  function cancelPreparingSession(id, reason) {
    setPreparingUploads(currentPreapringUploads => {
      const canceledSession = currentPreapringUploads.find(session => session.id == id);
      addCancelSession(canceledSession, reason);

      return currentPreapringUploads.filter(session => session.id !== id);
    });
  }

  function addUploadSession({
    id,
    file,
    cancelUpload,
    status,
    destinationDirId,
    path,
    progress = 0,
  }) {
    setActiveUploads(uploads => [
      {
        id,
        file,
        progress,
        cancelUpload,
        status,
        destinationDirId,
        path,
      },
      ...uploads,
    ]);
  }

  function addPreparingSession({ id, file, status, destinationDirId }) {
    setPreparingUploads(uploads => [
      ...uploads,
      {
        id,
        file,
        status,
        destinationDirId,
      },
    ]);
  }

  function updateSessionProgress(id, progress) {
    setActiveUploads(uploads =>
      uploads.map(session => (session.id == id ? { ...session, progress } : session)),
    );
  }

  function updateSessionStatus(id, newStatus) {
    setActiveUploads(uploads =>
      uploads.map(session => (session.id == id ? { ...session, status: newStatus } : session)),
    );
  }

  function updatePreparingSessionStatus(id, newStatus) {
    setPreparingUploads(uploads =>
      uploads.map(session => (session.id == id ? { ...session, status: newStatus } : session)),
    );
  }

  function deletePreparingSession(id) {
    setPreparingUploads(uploads => uploads.filter(session => session.id != id));
  }

  function deleteCancelSession(id) {
    setCancelUploads(uploads => uploads.filter(session => session.id != id));
  }

  function deleteReadySession(id) {
    setActiveUploads(uploads => uploads.filter(session => session.id != id));
  }

  function addCancelSession(canceledSession, reason) {
    setCancelUploads(uploads => {
      if (uploads.some(session => session.id == canceledSession.id)) return uploads;
      return [
        {
          ...canceledSession,
          reason,
          restart: () => {
            deleteCancelSession(canceledSession.id);
            createUploadSession(canceledSession.file, canceledSession.destinationDirId);
          },
          delete: () => {
            deleteCancelSession(canceledSession.id);
          },
        },
        ...uploads,
      ];
    });
  }

  function addReadySession(sessionId) {
    setActiveUploads(uploads => {
      const updatedSession = uploads[uploads.findIndex(value => value.id == sessionId)];
      updatedSession.openDir = () => {
        navigator(`/catalog/${updatedSession.destinationDirId}`);
      };
      updatedSession.delete = () => deleteReadySession(updatedSession.id);

      updatedSession.readyAt = Date.now();
      uploads.sort((a, b) => {
        const needStatus = FileSender.STATUS_COMPLETE;
        if (a.status == needStatus && b.status == needStatus) {
          return b.readyAt - a.readyAt;
        }
        if (a.status == needStatus) return 1;
        if (b.status == needStatus) return -1;
        return 0;
      });

      queryClient.invalidateQueries({
        queryKey: ["dir", updatedSession.destinationDirId],
      });
      return [...uploads];
    });
  }

  function calcCountActiveUpload() {
    const activeCount = activeUploads.reduce((acc, item) => {
      if (item.status !== FileSender.STATUS_COMPLETE) return ++acc;
      else return acc;
    }, 0);

    return activeCount + preparingUploads.length;
  }

  return (
    <UploadContext.Provider
      value={{
        addUploads,
        activeUploads,
        preparingUploads,
        cancelUploads,
        countOfActiveUpload: calcCountActiveUpload(),
        resumeUploads,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => useContext(UploadContext);
