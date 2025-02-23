import { createContext, useContext, useRef, useState } from "react";
import { FileSender } from "../API/FileSender";

const UploadContext = createContext();

export const UploadProvider = ({ children }) => {
  const [activeUploads, setActiveUploads] = useState([]);

  function addUploads(files) {
    if (activeUploads.size == 3) return;
    if (files instanceof FileList) {
      [...files].forEach((file) => createUploadSession(file));
    }
  }

  async function createUploadSession(file) {
    const fileSender = new FileSender(file);

    fileSender.onChunkLoad = ({ progress }) => {
      upadteSessionProgress(sessionId, progress);
    };

    const sessionId = await fileSender.startSending();

    addUploadSession({
      id: sessionId,
      fileName: file.name,
      status: fileSender.getStatus(),
      cancelUpload: () => {
        fileSender.cancelSending();
        cancelSession(sessionId);
      },
    });
  }

  function cancelSession(id) {
    setActiveUploads((uploads) =>
      uploads.map((session) =>
        session.id == id ? { ...session, progress: 0 } : session
      )
    );
  }

  function addUploadSession({ id, fileName, cancelUpload, status }) {
    setActiveUploads((uploads) => [
      ...uploads,
      {
        id,
        fileName,
        progress: 0,
        cancelUpload,
        status,
      },
    ]);
  }

  function upadteSessionProgress(id, progress) {
    setActiveUploads((uploads) =>
      uploads.map((session) =>
        session.id == id ? { ...session, progress } : session
      )
    );
  }

  function updateSessionStatus(id, newStatus) {}

  return (
    <UploadContext.Provider value={{ addUploads, activeUploads }}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => useContext(UploadContext);
