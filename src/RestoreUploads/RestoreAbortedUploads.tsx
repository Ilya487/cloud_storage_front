import ModalWindow from "../Components/ModalWindow/ModalWindow.jsx";
import { useEffect, useRef, type ChangeEvent, type FC } from "react";
import fileSizeDisplay from "../utils/fileSizeDisplay.js";
import clsx from "clsx";
import Spinner from "../Components/Spinner/Spinner.jsx";
import { useMachine } from "react-robot";
import { restoringSessionsStateMachine } from "./machine.js";
import type { MachineEvent, SelectFilesEvent } from "./machine.js";
import type { UploadRestoringInfo } from "./types.js";
import { uploadsLocalStorageManager } from "../utils/uploadsLocalStorageManager.js";
import { useUpload } from "../context/UploadContext.js";

const RestoreAbortedUploads: FC = () => {
  const [current, send] = useMachine(restoringSessionsStateMachine);
  const { resumeUploads } = useUpload();
  const hasAbortedUploads = useRef(uploadsLocalStorageManager.getUploads().length > 0);

  useEffect(() => {
    if (current.name == "exit" && current.context.dataForResumeUpload.length > 0) {
      resumeUploads(current.context.dataForResumeUpload);
    }
  }, [current.name]);

  const isLoading =
    current.name == "cancelingSessions" ||
    current.name == "loadingSessionsInfo" ||
    current.name == "cancelingSessionsAfterContinue";

  function handleFilesSelect(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files as FileList;
    const arr = Array.from(files);

    send({
      type: "selectFiles",
      files: arr,
    } as SelectFilesEvent);
  }

  function sendEvent(ev: MachineEvent) {
    send(ev);
  }

  if (current.name == "start" && !hasAbortedUploads.current) sendEvent("exit");
  if (current.name == "exit") return null;

  return (
    <>
      <ModalWindow>
        {(current.name == "selectingFiles" || current.name == "start") && (
          <p className="text-center mb-2">
            Похоже у вас есть незавершенные загрузки желаете продолжить?
          </p>
        )}

        {current.name == "start" && (
          <UploadList enableBorderStyle={false} uploads={current.context.uploadsList} />
        )}

        {current.name == "selectingFiles" && (
          <UploadList enableBorderStyle={true} uploads={current.context.uploadsList} />
        )}

        {(current.name == "start" || current.name == "selectingFiles") && (
          <>
            <p className="mb-1">Выберите файлы, загрузку которых желаете продолжить</p>
            <label className="cursor-pointer mb-3 inline-block">
              <p className="bg-green-900 mr-2 p-1 rounded">Выбор файлов</p>
              <input type="file" multiple onChange={handleFilesSelect} hidden />
            </label>

            <div className="flex justify-end">
              <button
                className="border mr-2 p-1 rounded disabled:text-gray-600"
                disabled={current.name == "start" || current.context.matchResult?.success == 0}
                onClick={() => sendEvent("continue")}
              >
                Продолжить
              </button>
              <button className="bg-red-600 p-1 rounded" onClick={() => sendEvent("cancel")}>
                Отмена
              </button>
            </div>
          </>
        )}

        {current.name == "confirmingExit" && (
          <ConfirmWindow
            title="Вы уверены что хотите выйти? Незавершенные загрузки будут отменены"
            okBtnTitle="Ok"
            onOk={() => sendEvent("exit")}
            onCancel={() => sendEvent("back")}
          />
        )}

        {isLoading && (
          <div className="h-80 flex items-center justify-center">
            <Spinner />
          </div>
        )}
        {current.name == "confirmingContinue" && (
          <ConfirmWindow
            title="Вы уверены что хотите продолжить? Часть загрузок может быть утеряна"
            okBtnTitle="Продолжить"
            onOk={() => sendEvent("confirm")}
            onCancel={() => sendEvent("back")}
          />
        )}

        {current.name == "handlingRestoreResult" && (
          <>
            <UploadList enableBorderStyle={true} uploads={current.context.unrestoredUploads} />
            <div className="flex justify-center">
              <button className="border rounded p-1" onClick={() => sendEvent("confirm")}>
                Ok
              </button>
            </div>
          </>
        )}

        {current.name == "handlingRestoreSessionErrorResponse" && (
          <>
            <p className="text-center mb-2 text-red-600">
              Не удалось получить информацию о загрузках
            </p>
            <div className="flex justify-center">
              <button className="border rounded p-1 mr-4" onClick={() => sendEvent("retry")}>
                Повторить
              </button>
              <button className="border rounded p-1" onClick={() => sendEvent("back")}>
                Назад
              </button>
            </div>
          </>
        )}
      </ModalWindow>
    </>
  );
};

export default RestoreAbortedUploads;

const UploadList: FC<{
  uploads: UploadRestoringInfo[];
  enableBorderStyle: boolean;
}> = ({ uploads, enableBorderStyle = false }) => {
  return (
    <ul className="overflow-auto max-h-80 mb-3 p-2 thin-scrollbar">
      {uploads.map(upload => (
        <li
          className={clsx(
            "mb-2 p-2 border rounded",
            enableBorderStyle && upload.reason && "border-red-600",
            enableBorderStyle && !upload.reason && "border-green-500",
          )}
          key={upload.sessionId}
        >
          <p>Имя: {upload.fileInfo.name}</p>
          <p>Размер: {fileSizeDisplay(upload.fileInfo.size)}</p>
          <p>Последнее изменение: {new Date(upload.fileInfo.lastModified).toLocaleDateString()}</p>
          {upload.reason && <p className="mt-2 text-red-600">{upload.reason}</p>}
        </li>
      ))}
    </ul>
  );
};

interface ConfirmWindowProps {
  title: string;
  onOk: () => void;
  onCancel: () => void;
  okBtnTitle?: string;
  cancelBtnTitle?: string;
}

const ConfirmWindow: FC<ConfirmWindowProps> = ({
  title,
  onOk,
  onCancel,
  okBtnTitle = "Ок",
  cancelBtnTitle = "Отмена",
}) => {
  return (
    <div className="">
      <p className="text-center mb-5">{title}</p>
      <div className="flex items-center justify-center">
        <button className="mr-3 border p-1 rounded" onClick={onOk}>
          {okBtnTitle}
        </button>
        <button className="border p-1 rounded" onClick={onCancel}>
          {cancelBtnTitle}
        </button>
      </div>
    </div>
  );
};
