import { useRenameFolder } from "../../API/fileSystemService";
import useInput from "../../hooks/useInput";
import useOutsideHandle from "../../hooks/useOutsideHandle";
import ModalWindow from "../ModalWindow/ModalWindow";
import styles from "./RenameDialog.module.css";
import { IoMdCloseCircleOutline } from "react-icons/io";

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
        <IoMdCloseCircleOutline
          className={styles["close-icon"]}
          onClick={handleClose}
        />
      </div>
      <form onSubmit={submitRename}>
        <input
          type="text"
          value={name}
          className={styles.input}
          onInput={handleName}
          autoFocus
          onFocus={(e) => e.target.select()}
        />
        <div className={styles["buttons-block"]}>
          <button
            className={`${styles.btn} ${styles["ok-btn"]}`}
            disabled={mutation.isPending}
            type="submit"
          >
            Ок
          </button>
          <button
            className={`${styles.btn} ${styles["cancel-btn"]}`}
            onClick={handleClose}
            disabled={mutation.isPending}
          >
            Отмена
          </button>
        </div>
      </form>
    </ModalWindow>
  );
};

export default RenameDialog;
