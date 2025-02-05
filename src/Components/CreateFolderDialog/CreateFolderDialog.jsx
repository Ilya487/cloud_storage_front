import { IoMdCloseCircleOutline } from "react-icons/io";
import ModalWindow from "../ModalWindow/ModalWindow";
import styles from "./CreateFolderDialog.module.css";
import useInput from "../../hooks/useInput";
import { useCreateFolder } from "../../API/fileSystemService";
import useOutsideHandle from "../../hooks/useOutsideHandle";

const CreateFolderDialog = ({ dirId, onFolderCreate, onClose }) => {
  const [name, handleName] = useInput("");
  const mutation = useCreateFolder();
  const modalWindowRef = useOutsideHandle(["click"], handleClose, true);

  function handleClose() {
    onClose();
  }

  function submitCreateFolder(e) {
    e.preventDefault();

    mutation.mutate(
      { name, parentDirId: dirId },
      {
        onSuccess: () => {
          handleClose();
          onFolderCreate();
        },
      }
    );
  }

  return (
    <ModalWindow ref={modalWindowRef}>
      <div className={styles["top-block"]}>
        <p className={styles.title}>Создать папку</p>
        <IoMdCloseCircleOutline
          className="dialog__close-icon"
          onClick={handleClose}
        />
      </div>
      <form onSubmit={submitCreateFolder}>
        <input
          type="text"
          value={name}
          className="dialog__input"
          onInput={handleName}
          autoFocus
          onFocus={(e) => e.target.select()}
        />
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
          >
            Отмена
          </button>
        </div>
      </form>
    </ModalWindow>
  );
};

export default CreateFolderDialog;
