import ModalWindow from "../ModalWindow/ModalWindow";
import styles from "./DeleteDialog.module.css";
import { useDeleteObject } from "../../API/fileSystemService";
import useOutsideHandle from "../../hooks/useOutsideHandle";
import CancelBtn from "../CancelBtn/CancelBtn";
import useErrorToast from "../../hooks/useErrorToast";

const DeleteDialog = ({ objectId, name, onDelete, onClose }) => {
  const mutation = useDeleteObject();
  const modalWindowRef = useOutsideHandle(["click"], handleClose, true);
  const showErrorToast = useErrorToast();

  function handleClose() {
    onClose();
  }

  function submitDelete(e) {
    e.preventDefault();

    mutation.mutate(
      { objectId },
      {
        onSuccess: () => {
          handleClose();
          onDelete();
        },
        onError: error => showErrorToast(error.message),
      }
    );
  }

  return (
    <ModalWindow ref={modalWindowRef} closeCb={handleClose}>
      <div className={styles["top-block"]}>
        <p className={styles.title}>Удалить навсегда?</p>
        <CancelBtn onClick={handleClose} />
      </div>
      <p className={styles["delete-msg"]}>Объект "{name}" будет удален навсегда.</p>
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
