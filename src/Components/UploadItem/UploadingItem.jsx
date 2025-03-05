import clsx from "clsx";
import styles from "./UploadItem.module.css";
import { FileSender } from "../../API/FileSender";
import CancelBtn from "../CancelBtn/CancelBtn";
import readyStyles from "./ReadyUpload.module.css";

const UploadingItem = ({ session }) => {
  if (session.status == FileSender.STATUS_SENDING) {
    return (
      <li className={styles["upload-item"]}>
        <div className={styles.top}>
          <p>{session.file.name}</p>
          <CancelBtn onClick={session.cancelUpload} />
        </div>
        <span className={styles.status}>Загрузка...</span>
        <div className={styles["progress-bar"]}>
          <div style={{ width: session.progress + "%" }}></div>
        </div>
      </li>
    );
  }

  if (session.status == FileSender.STATUS_CANCELING) {
    return (
      <li className={styles["upload-item"]}>
        <div className={styles.top}>
          <p>{session.file.name}</p>
        </div>
        <span className={styles.status}>Отмена...</span>
        <div className={clsx(styles["loading-bar"], styles["canceling-bar"])}></div>
      </li>
    );
  }

  if (session.status == FileSender.STATUS_COMPLETE) {
    return (
      <li className={styles["upload-item"]}>
        <div className={styles.top}>
          <p>{session.file.name}</p>
          <CancelBtn onClick={session.delete} />
        </div>
        <div className={clsx(styles.status, readyStyles["ready-status"])}>
          <span>Готово</span>
          <button
            onClick={session.openDir}
            className={clsx(styles.status, readyStyles["open-dir"])}
          >
            Открыть папку
          </button>
        </div>
      </li>
    );
  }
};

export default UploadingItem;
