import { createContext, useContext, useState } from "react";
import { FileSender } from "../API/FileSender";

const UploadContext = createContext();

export const UploadProvider = ({ children }) => {
  const [activeUploads, setActiveUploads] = useState([]);
  const [preparingUploads, setPreparingUploads] = useState([]);
  const [cancelUploads, setCancelUploads] = useState([]);

  function addUploads(files, destinationDirId) {
    if (activeUploads.size == 3) return;
    if (files instanceof FileList) {
      [...files].forEach((file) => createUploadSession(file, destinationDirId));
    }
  }

  async function createUploadSession(file, destinationDirId) {
    const fileSender = new FileSender(file, destinationDirId);
    const generatedKey = file.name + Date.now();

    fileSender.onChunkLoad = ({ progress }) => {
      updateSessionProgress(sessionId, progress);
    };

    fileSender.onStatusUpdate = (status) => {
      if (status == FileSender.STATUS_PREPARING) {
        updatePreparingSessionStatus(generatedKey, status);
      } else {
        deletePreparingSession(generatedKey);
        updateSessionStatus(sessionId, status);
      }
    };

    fileSender.onError = (message) => {
      if (fileSender.getStatus() == FileSender.STATUS_PREPARING) {
        cancelPreparingSession(generatedKey, message);
      } else cancelActiveSession(sessionId, message);
    };

    addPreparingSession({
      id: generatedKey,
      file,
      status: fileSender.getStatus(),
      destinationDirId,
    });
    const sessionId = await fileSender.initialize();
    fileSender.start();

    addUploadSession({
      id: sessionId,
      file,
      status: fileSender.getStatus(),
      destinationDirId,
      cancelUpload: async () => {
        if (fileSender.getStatus() !== FileSender.STATUS_SENDING) return;
        await fileSender.cancelSending();
        cancelActiveSession(sessionId, "Отменен");
      },
    });
  }

  function cancelActiveSession(id, reason) {
    setActiveUploads((currentActiveUploads) => {
      const canceledSession = currentActiveUploads.find(
        (session) => session.id == id
      );
      addCancelSession(canceledSession, reason);

      return currentActiveUploads.filter((session) => session.id !== id);
    });
  }

  function cancelPreparingSession(id, reason) {
    setPreparingUploads((currentPreapringUploads) => {
      const canceledSession = currentPreapringUploads.find(
        (session) => session.id == id
      );
      addCancelSession(canceledSession, reason);

      return currentPreapringUploads.filter((session) => session.id !== id);
    });
  }

  function addUploadSession({
    id,
    file,
    cancelUpload,
    status,
    destinationDirId,
  }) {
    setActiveUploads((uploads) => [
      ...uploads,
      {
        id,
        file,
        progress: 0,
        cancelUpload,
        status,
        destinationDirId,
      },
    ]);
  }

  function addPreparingSession({ id, file, status, destinationDirId }) {
    setPreparingUploads((uploads) => [
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
    setActiveUploads((uploads) =>
      uploads.map((session) =>
        session.id == id ? { ...session, progress } : session
      )
    );
  }

  function updateSessionStatus(id, newStatus) {
    setActiveUploads((uploads) =>
      uploads.map((session) =>
        session.id == id ? { ...session, status: newStatus } : session
      )
    );
  }

  function updatePreparingSessionStatus(id, newStatus) {
    setPreparingUploads((uploads) =>
      uploads.map((session) =>
        session.id == id ? { ...session, status: newStatus } : session
      )
    );
  }

  function deletePreparingSession(id) {
    setPreparingUploads((uploads) =>
      uploads.filter((session) => session.id != id)
    );
  }

  function deleteCancelSession(id) {
    setCancelUploads((uploads) =>
      uploads.filter((session) => session.id != id)
    );
  }

  function addCancelSession(canceledSession, reason) {
    setCancelUploads((uploads) => {
      if (uploads.some((session) => session.id == canceledSession.id))
        return uploads;
      return [
        ...uploads,
        {
          ...canceledSession,
          reason,
          restart: () => {
            deleteCancelSession(canceledSession.id);
            createUploadSession(
              canceledSession.file,
              canceledSession.destinationDirId
            );
          },
          delete: () => {
            deleteCancelSession(canceledSession.id);
          },
        },
      ];
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
      }}
    >
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => useContext(UploadContext);
