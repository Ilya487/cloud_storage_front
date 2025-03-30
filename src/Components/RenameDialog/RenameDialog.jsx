import { useRenameObject } from "../../API/fileSystemService";
import useInput from "../../hooks/useInput";
import useOutsideHandle from "../../hooks/useOutsideHandle";
import CancelBtn from "../CancelBtn/CancelBtn";
import ModalWindow from "../ModalWindow/ModalWindow";
import styles from "./RenameDialog.module.css";

const RenameDialog = ({ objectId, defaultName, onRename, onClose, type }) => {
  const [extPos, ext] = getExt();

  const [name, handleName] = useInput(defaultName.slice(0, extPos));
  const mutation = useRenameObject();
  const modalWindowRef = useOutsideHandle(["click"], handleClose, true);

  function getExt() {
    if (type == "folder") return [undefined, ""];

    const extPos = defaultName.lastIndexOf(".");
    if (extPos == -1) return [undefined, ""];
    const ext = defaultName.slice(extPos);

    return [extPos, ext];
  }

  function handleClose() {
    onClose();
  }

  function submitRename(e) {
    e.preventDefault();
    if (name + ext == defaultName) return;

    mutation.mutate(
      { objectId, newName: name + ext },
      {
        onSuccess: () => {
          handleClose();
          onRename();
        },
      }
    );
  }

  return (
    <ModalWindow ref={modalWindowRef}>
      <div className={styles["top-block"]}>
        <p className={styles.title}>Переименовать</p>
        <CancelBtn onClick={handleClose} />
      </div>
      <form onSubmit={submitRename}>
        <input
          type="text"
          value={name}
          className="dialog__input"
          onInput={handleName}
          autoFocus
          onFocus={e => e.target.select()}
        />
        <div className={styles["buttons-block"]}>
          <button
            className={`dialog__btn ${styles["ok-btn"]}`}
            disabled={mutation.isPending}
            type="submit"
          >
            Ок
          </button>
          <button className="dialog__btn" onClick={handleClose} disabled={mutation.isPending}>
            Отмена
          </button>
        </div>
      </form>
    </ModalWindow>
  );
};

export default RenameDialog;
