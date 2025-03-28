import { useRenameFolder } from "../../API/fileSystemService";
import useInput from "../../hooks/useInput";
import useOutsideHandle from "../../hooks/useOutsideHandle";
import CancelBtn from "../CancelBtn/CancelBtn";
import ModalWindow from "../ModalWindow/ModalWindow";
import styles from "./RenameDialog.module.css";

const RenameDialog = ({ dirId, defaultName, onRename, onClose }) => {
  const [name, handleName] = useInput(defaultName);
  const mutation = useRenameFolder();
  const modalWindowRef = useOutsideHandle(["click"], handleClose, true);

  function handleClose() {
    onClose();
  }

  function submitRename(e) {
    e.preventDefault();
    if (name == defaultName) return;

    mutation.mutate(
      { dirId, newName: name },
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
