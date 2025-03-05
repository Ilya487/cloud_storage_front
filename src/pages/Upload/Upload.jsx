import CanceledUpload from "../../Components/UploadItem/CanceledUpload";
import PreparingUpload from "../../Components/UploadItem/PreparingUpload";
import UploadingItem from "../../Components/UploadItem/UploadingItem";
import { useUpload } from "../../context/UploadContext";
import styles from "./Upload.module.css";

const Upload = () => {
  const { activeUploads, preparingUploads, cancelUploads } = useUpload();

  if (activeUploads.length + preparingUploads.length + cancelUploads.length == 0) {
    return (
      <section className={styles["upload-page"]}>
        <p className={styles["empty"]}>Загрузки не найдены</p>
      </section>
    );
  }

  return (
    <section className={styles["upload-page"]}>
      <ul>
        {preparingUploads.map(session => (
          <PreparingUpload session={session} key={session.id} />
        ))}

        {activeUploads.map(session => (
          <UploadingItem session={session} key={session.id} />
        ))}

        {cancelUploads.map(session => (
          <CanceledUpload session={session} key={session.id} />
        ))}
      </ul>
    </section>
  );
};

export default Upload;
