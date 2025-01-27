import useInput from "../../hooks/useInput";
import ModalWindow from "../ModalWindow/ModalWindow";
import styles from "./RenameDialog.module.css";
import { IoMdCloseCircleOutline } from "react-icons/io";

const RenameDialog = ({ dirId, defaultName }) => {
  const [name, handleName] = useInput(defaultName);

  return (
    <ModalWindow>
      <div className={styles["top-block"]}>
        <p className={styles.title}>Переименовать</p>
        <IoMdCloseCircleOutline className={styles["close-icon"]} />
      </div>
      <input
        type="text"
        value={name}
        className={styles.input}
        onInput={handleName}
      />
      <div className={styles["buttons-block"]}>
        <button className={`${styles.btn} ${styles["ok-btn"]}`}>Ок</button>
        <button className={`${styles.btn} ${styles["cancel-btn"]}`}>
          Отмена
        </button>
      </div>
    </ModalWindow>
  );
};

export default RenameDialog;
