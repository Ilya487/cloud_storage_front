import { IoMdCloseCircleOutline } from "react-icons/io";
import ModalWindow from "../ModalWindow/ModalWindow";
import styles from "./DeleteDialog.module.css";
import { useDeleteFolder } from "../../API/fileSystemService";
import useOutsideHandle from "../../hooks/useOutsideHandle";

const DeleteDialog = ({ dirId, name, onDelete, onClose }) => {
  const mutation = useDeleteFolder();
  const modalWindowRef = useOutsideHandle(["click"], handleClose, true);

  function handleClose() {
    onClose();
  }

  function submitDelete(e) {
    e.preventDefault();

    mutation.mutate(
      { dirId },
      {
        onSuccess: () => {
          handleClose();
          onDelete();
        },
      }
    );
  }

  return (
    <ModalWindow ref={modalWindowRef}>
      <div className={styles["top-block"]}>
        <p className={styles.title}>Удалить навсегда?</p>
        <IoMdCloseCircleOutline
          className="dialog__close-icon"
          onClick={handleClose}
        />
      </div>
      <p className={styles["delete-msg"]}>
        Объект "{name}" будет удален навсегда.
      </p>
      <form onSubmit={submitDelete}>
        <div className={styles["buttons-block"]}>
          <button
            className={`dialog__btn ${styles["ok-btn"]}`}
            disabled={mutation.isPending}
            type="submit"
          >
            Ок
          </button>
          <button
            className="dialog__btn"
            onClick={handleClose}
            disabled={mutation.isPending}
            type="button"
          >
            Отмена
          </button>
        </div>
      </form>
    </ModalWindow>
  );
};

export default DeleteDialog;
