import { createContext, useContext, type ReactNode } from "react";
import {
  FileSender,
  type SendingStatus,
  type FileSenderCallbacks,
  type TDestinationDirId,
} from "../API/FileSender/FileSender.ts";
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

const RETRIES_COUNT = 2;

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
    files.forEach(file => createUploadSession(file, destinationDirId));
  };

  const resumeUploads: ResumeUploads = (resumeData: UploadResumeData[]) => {
    resumeData.forEach(data => createResumeFileSender(data));
  };

  async function createUploadSession(file: File, destinationDirId: TDestinationDirId) {
    const fileSender = NewFileSenderCreator.create(file, destinationDirId, RETRIES_COUNT);
    fileSender.start();
  }

  function createResumeFileSender(resumeData: UploadResumeData) {
    const fileSender = ResumeFileSenderCreator.create(resumeData, RETRIES_COUNT);
    fileSender.start();
  }

  abstract class FileSenderCreator {
    protected initialize(fileSender: FileSender) {
      fileSender.onChunkLoad = data => this.onChunkLoad(data);
      fileSender.onError = msg => this.errorHandler(msg);
      fileSender.onFileLoad = () => this.onFileLoad();
      fileSender.onStatusUpdate = s => this.statusHandler(s);
    }

    private statusHandler(
      ...args: Parameters<FileSenderCallbacks["onStatusUpdate"]>
    ): ReturnType<FileSenderCallbacks["onStatusUpdate"]> {
      const [status] = args;

      if (status == "building") this.buildingStatusHandler();
      else if (status == "cancel") this.cancelStatusHandler();
      else if (status == "canceling") this.cancelingStatusHandler();
      else if (status == "complete") this.completeStatusHandler();
      else if (status == "sending") this.sendingStatusHandler();
      else this.handleUnknownStatus(status);
    }

    protected onChunkLoad(
      ...args: Parameters<FileSenderCallbacks["onChunkLoad"]>
    ): ReturnType<FileSenderCallbacks["onChunkLoad"]> {
      const progress = args[0].progress;
      sessionsManager.updateSessionProgress(this.getSessionId(), progress);
    }

    protected onFileLoad(
      ...args: Parameters<FileSenderCallbacks["onFileLoad"]>
    ): ReturnType<FileSenderCallbacks["onFileLoad"]> {
      toast(`Файл "${this.getFile().name}" успешно загружен.`, {
        type: "success",
        position: "top-center",
        autoClose: 2500,
      });

      sessionsManager.addReadySession({
        sessionId: this.getSessionId(),
        onDelete: () => sessionsManager.deleteSession(this.getSessionId()),
        onOpenDir: () => navigator(`/catalog/${this.getDestinationDirId()}`),
      });

      queryClient.invalidateQueries({
        queryKey: [
          "dir",
          this.getDestinationDirId() == "root" ? "root" : this.getDestinationDirId(),
        ],
      });
      uploadsLocalStorageManager.deleteItem(this.getSessionId());
    }

    protected cancelStatusHandler() {
      sessionsManager.updateSessionStatus(this.getSessionId(), "cancel");
      uploadsLocalStorageManager.deleteItem(this.getSessionId());
    }

    protected cancelingStatusHandler() {
      sessionsManager.updateSessionStatus(this.getSessionId(), "canceling");
    }

    protected buildingStatusHandler() {
      sessionsManager.updateSessionStatus(this.getSessionId(), "building");
    }

    protected completeStatusHandler() {
      sessionsManager.updateSessionStatus(this.getSessionId(), "complete");
    }

    protected sendingStatusHandler() {
      sessionsManager.updateSessionStatus(this.getSessionId(), "sending");
    }

    protected errorHandler(
      ...args: Parameters<FileSenderCallbacks["onError"]>
    ): ReturnType<FileSenderCallbacks["onError"]> {
      const [message] = args;
      this.cancelSession(this.getSessionId(), message);
    }

    protected cancelSession(id: number | string, message: string) {
      sessionsManager.cancelSession(
        ...generateCanceledSessionsParams(id, message, this.getFile(), this.getDestinationDirId()),
      );
    }

    protected abstract getSessionId(): number;
    protected abstract getDestinationDirId(): TDestinationDirId;
    protected abstract getFile(): File;
    protected abstract handleUnknownStatus(status: SendingStatus): void;
  }

  class NewFileSenderCreator extends FileSenderCreator {
    private sessionId?: number;
    private generatedKey: string;
    private file: File;
    private destinationDirId: TDestinationDirId;
    private fileSender: NewFileSender;

    static create(file: File, destinationDirId: TDestinationDirId, retriesCount: number) {
      return new NewFileSenderCreator(file, destinationDirId, retriesCount).create();
    }

    private constructor(file: File, destinationDirId: TDestinationDirId, retriesCount: number) {
      super();
      this.fileSender = new NewFileSender({ file, destinationDirId, retriesCount });
      this.file = file;
      this.destinationDirId = destinationDirId;
      this.generatedKey = this.generateTmpKey(file);
    }

    private create(): FileSender {
      super.initialize(this.fileSender);
      this.fileSender.onSessionIni = (id, path) => this.onSessionIni(id, path);

      return this.fileSender;
    }

    private generateTmpKey(file: File) {
      return file.name + file.size + file.lastModified + Date.now() + Math.random() * 1000;
    }

    protected override errorHandler(message: string): ReturnType<FileSenderCallbacks["onError"]> {
      if (this.sessionId) {
        super.errorHandler(message);
        return;
      }

      this.cancelSession(this.generatedKey, message);
    }

    protected override cancelStatusHandler(): void {
      if (this.sessionId) {
        super.cancelStatusHandler();
        return;
      }

      sessionsManager.updateSessionStatus(this.generatedKey, "cancel");
    }

    protected override getSessionId(): number {
      if (!this.sessionId) throw new Error("Сессия еще не инициализирована");
      return this.sessionId;
    }

    protected override getDestinationDirId(): TDestinationDirId {
      return this.destinationDirId;
    }

    protected override getFile(): File {
      return this.file;
    }

    protected override handleUnknownStatus(status: SendingStatus): void {
      if (status == "preparing") this.preparingStatusHandler();
      if (status == "sending") this.sendingStatusHandler();
    }

    protected override sendingStatusHandler() {
      sessionsManager.deleteSession(this.generatedKey);
      if (!this.sessionId) throw new Error("Сессия не инициализирована");
      super.sendingStatusHandler();
    }

    private onSessionIni: NonNullable<NewFileSender["onSessionIni"]> = (id, path) => {
      this.sessionId = id;
      uploadsLocalStorageManager.addItem(this.file, this.sessionId);

      sessionsManager.addSendingUploadSession({
        id: this.sessionId,
        file: this.file,
        status: "sending",
        progress: 0,
        path,
        destinationDirId: this.destinationDirId,
        cancelUpload: async () => {
          await this.fileSender.cancelSending();
          this.cancelSession(id, "Отменен");
          uploadsLocalStorageManager.deleteItem(id);
        },
      });
    };

    private preparingStatusHandler() {
      sessionsManager.addPreparingSession({
        id: this.generatedKey,
        file: this.file,
        status: "preparing",
        destinationDirId: this.destinationDirId,
      });
    }
  }

  class ResumeFileSenderCreator extends FileSenderCreator {
    private resumeData: UploadResumeData;
    private fileSender: ResumeFileSender;

    static create(resumeData: UploadResumeData, retriesCount: number) {
      return new ResumeFileSenderCreator(resumeData, retriesCount).create();
    }

    private constructor(resumeData: UploadResumeData, retriesCount: number) {
      super();
      this.resumeData = resumeData;
      this.fileSender = new ResumeFileSender({ resumeData, retriesCount });
    }

    private create(): FileSender {
      super.initialize(this.fileSender);

      const originalFileSenderStart = this.fileSender.start.bind(this.fileSender);

      this.fileSender.start = () => {
        sessionsManager.addSendingUploadSession({
          id: this.resumeData.id,
          file: this.resumeData.file,
          status: "sending",
          path: this.resumeData.path,
          destinationDirId: this.resumeData.destinationDirId,
          progress: (this.resumeData.readyChunks.length / this.resumeData.chunksCount) * 100,
          cancelUpload: async () => {
            await this.fileSender.cancelSending();
            this.cancelSession(this.resumeData.id, "Отменен");
            uploadsLocalStorageManager.deleteItem(this.resumeData.id);
          },
        });

        originalFileSenderStart();
      };

      return this.fileSender;
    }

    protected override getSessionId(): number {
      return this.resumeData.id;
    }
    protected override getDestinationDirId(): TDestinationDirId {
      return this.resumeData.destinationDirId;
    }
    protected override getFile(): File {
      return this.resumeData.file;
    }
    protected override handleUnknownStatus(status: SendingStatus): void {}
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
