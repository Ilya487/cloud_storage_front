import clsx from "clsx";
import styles from "./UploadItem.module.css";

const PreparingUpload = ({ session }) => {
  return (
    <li className={styles["upload-item"]}>
      <div className={styles.top}>
        <p>{session.file.name}</p>
      </div>
      <span className={styles.status}>Подготовка загрузки</span>
      <div className={clsx(styles["loading-bar"], styles["preparing-bar"])} />
    </li>
  );
};

export default PreparingUpload;
