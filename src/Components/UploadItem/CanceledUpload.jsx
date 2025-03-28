import clsx from "clsx";
import styles from "./UploadItem.module.css";
import cancelStyles from "./CanceledUpload.module.css";
import CancelBtn from "../CancelBtn/CancelBtn";
import { VscDebugRestart } from "react-icons/vsc";

const CanceledUpload = ({ session }) => {
  return (
    <li className={clsx(styles["upload-item"], cancelStyles["canceled-item"])}>
      <div className={clsx(styles.top, cancelStyles["cancel-top"])}>
        <p>{session.file.name}</p>
        <CancelBtn onClick={session.delete} />
      </div>
      {session.path && <span className={styles.path}>Путь: {session.path}</span>}
      <div className={cancelStyles["bottom-wrap"]}>
        <span className={clsx(styles.status, cancelStyles["cancel-reason"])}>{session.reason}</span>
        <div className={cancelStyles["restart-wrap"]}>
          <VscDebugRestart size={22} className={cancelStyles.restart} onClick={session.restart} />
        </div>
      </div>
    </li>
  );
};

export default CanceledUpload;
