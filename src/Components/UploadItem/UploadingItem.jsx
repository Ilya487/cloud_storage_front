import clsx from "clsx";
import styles from "./UploadItem.module.css";
import { FileSender } from "../../API/FileSender";
import CancelBtn from "../CancelBtn/CancelBtn";
import readyStyles from "./ReadyUpload.module.css";

const UploadingItem = ({ session }) => {
  if (session.status == FileSender.STATUS_SENDING) {
    const totalSize = (session.file.size / 1024 / 1024).toFixed(2);
    const readySize = (((session.file.size / 1024 / 1024) * session.progress) / 100).toFixed(2);

    return (
      <li className={styles["upload-item"]}>
        <div className={styles.top}>
          <p>{session.file.name}</p>
          <CancelBtn onClick={session.cancelUpload} />
        </div>
        <span className={styles.path}>Путь: {session.path}</span>
        <span className={styles["load-info"]}>
          Готово {readySize}MB из {totalSize}MB
        </span>
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
        {session.path && <span className={styles.path}>Путь: {session.path}</span>}
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
        <span className={styles.path}>Путь: {session.path}</span>
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
