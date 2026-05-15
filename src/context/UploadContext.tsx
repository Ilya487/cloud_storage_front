import { createContext, useContext, type ReactNode } from "react";
import { FileSender, type TDestinationDirId } from "../API/FileSender/FileSender.ts";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { uploadsLocalStorageManager } from "../utils/uploadsLocalStorageManager.ts";
import type { UploadResumeData } from "../RestoreUploads/types.ts";
import { NewFileSender } from "../API/FileSender/NewFileSender.ts";
import { ResumeFileSender } from "../API/FileSender/ResumeFileSender.ts";
import useUploadSessions, { type UploadSession } from "./useUploadSessions.ts";

type AddUploads = (files: File[], destinationDirId: TDestinationDirId) => void;
type ResumeUploads = (resumeData: UploadResumeData[]) => void;

interface UploadContext {
  addUploads: AddUploads;
  resumeUploads: ResumeUploads;
  uploadSessions: UploadSession[];
  countOfActiveUpload: number;
}

const UploadContext = createContext<UploadContext | null>(null);

export const UploadProvider = ({ children }: { children: ReactNode }) => {
  const { uploadSessions, sessionsManager, countOfActiveUpload } = useUploadSessions();
  const queryClient = useQueryClient();
  const navigator = useNavigate();

  function generateCanceledSessionsParams(
    id: string | number,
    reason: string,
    file: File,
    destinationDirId: TDestinationDirId,
  ): Parameters<typeof sessionsManager.cancelSession> {
    return [
      {
        id,
        reason,
        onRestart() {
          sessionsManager.deleteSession(id);
          createUploadSession(file, destinationDirId);
        },
        onDelete() {
          sessionsManager.deleteSession(id);
        },
      },
    ];
  }

  const addUploads: AddUploads = (files: File[], destinationDirId: TDestinationDirId) => {
    files.forEach(file => {
      if (file instanceof File) createUploadSession(file, destinationDirId);
    });
  };

  async function createUploadSession(file: File, destinationDirId: TDestinationDirId) {
    const fileSender = new NewFileSender({ file, destinationDirId, retriesCount: 2 });
    const generatedKey = file.name + file.size + file.lastModified + Date.now();
    let sessionId: number | string;

    fileSender.onChunkLoad = ({ progress }) => {
      sessionsManager.updateSessionProgress(+sessionId, progress);
    };

    fileSender.onFileLoad = () => {
      toast(`Файл "${file.name}" успешно загружен.`, {
        type: "success",
        position: "top-center",
        autoClose: 2500,
      });

      sessionsManager.addReadySession({
        sessionId: +sessionId,
        onDelete: () => sessionsManager.deleteSession(sessionId),
        onOpenDir: () => navigator(`/catalog/${destinationDirId}`),
      });

      queryClient.invalidateQueries({
        queryKey: ["dir", destinationDirId == "root" ? destinationDirId : +destinationDirId],
      });
      uploadsLocalStorageManager.deleteItem(+sessionId);
    };

    fileSender.onStatusUpdate = status => {
      if (status == "preparing") {
        sessionsManager.addPreparingSession({
          id: generatedKey,
          file,
          status: "preparing",
          destinationDirId,
        });
      } else if (status == "cancel" && !sessionId) {
        sessionsManager.updateSessionStatus(generatedKey, status);
      } else if (status == "cancel") {
        uploadsLocalStorageManager.deleteItem(+sessionId);
      } else if (status == "building") {
        sessionsManager.updateSessionStatus(sessionId, status);
      } else {
        status == "sending" && sessionsManager.deleteSession(generatedKey);
        sessionsManager.updateSessionStatus(sessionId, status);
      }
    };

    fileSender.onError = message => {
      if (!sessionId) {
        sessionsManager.cancelSession(
          ...generateCanceledSessionsParams(generatedKey, message, file, destinationDirId),
        );
      } else
        sessionsManager.cancelSession(
          ...generateCanceledSessionsParams(sessionId, message, file, destinationDirId),
        );
    };

    fileSender.onSessionIni = (id, path) => {
      sessionId = id;
      uploadsLocalStorageManager.addItem(file, sessionId);

      sessionsManager.addSendingUploadSession({
        id: sessionId,
        file,
        status: "sending",
        progress: 0,
        path,
        destinationDirId,
        cancelUpload: async () => {
          await fileSender.cancelSending();
          (sessionsManager.cancelSession(
            ...generateCanceledSessionsParams(id, "Отменен", file, destinationDirId),
          ),
            uploadsLocalStorageManager.deleteItem(id));
        },
      });
    };

    fileSender.start();
  }

  const resumeUploads: ResumeUploads = (resumeData: UploadResumeData[]) => {
    resumeData.forEach(v => createResumeFileSender(v));
  };

  function createResumeFileSender(resumeData: UploadResumeData) {
    const fileSender = new ResumeFileSender({ resumeData, retriesCount: 2 });

    fileSender.onChunkLoad = ({ progress }) => {
      sessionsManager.updateSessionProgress(resumeData.id, progress);
    };

    fileSender.onFileLoad = () => {
      toast(`Файл "${resumeData.file.name}" успешно загружен.`, {
        type: "success",
        position: "top-center",
        autoClose: 2500,
      });

      sessionsManager.addReadySession({
        sessionId: resumeData.id,
        onDelete: () => sessionsManager.deleteSession(resumeData.id),
        onOpenDir: () => navigator(`/catalog/${resumeData.destinationDirId}`),
      });

      queryClient.invalidateQueries({
        queryKey: [
          "dir",
          resumeData.destinationDirId == "root" ? "root" : resumeData.destinationDirId,
        ],
      });
      uploadsLocalStorageManager.deleteItem(resumeData.id);
    };

    fileSender.onStatusUpdate = status => {
      if (status == "cancel") {
        sessionsManager.updateSessionStatus(resumeData.id, status);
        uploadsLocalStorageManager.deleteItem(resumeData.id);
      } else if (status == FileSender.STATUS_BUILDING) {
        sessionsManager.updateSessionStatus(resumeData.id, status);
      } else {
        sessionsManager.updateSessionStatus(resumeData.id, status);
      }
    };

    fileSender.onError = message => {
      sessionsManager.cancelSession(
        ...generateCanceledSessionsParams(
          resumeData.id,
          message,
          resumeData.file,
          resumeData.destinationDirId,
        ),
      );
    };

    sessionsManager.addSendingUploadSession({
      id: resumeData.id,
      file: resumeData.file,
      status: "sending",
      path: resumeData.path,
      destinationDirId: resumeData.destinationDirId,
      progress: (resumeData.readyChunks.length / resumeData.chunksCount) * 100,
      cancelUpload: async () => {
        await fileSender.cancelSending();
        sessionsManager.cancelSession(
          ...generateCanceledSessionsParams(
            resumeData.id,
            "Отменен",
            resumeData.file,
            resumeData.destinationDirId,
          ),
        );
        uploadsLocalStorageManager.deleteItem(resumeData.id);
      },
    });

    fileSender.start();
  }

  return (
    <UploadContext.Provider
      value={{
        addUploads,
        resumeUploads,
        uploadSessions,
        countOfActiveUpload,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
};
