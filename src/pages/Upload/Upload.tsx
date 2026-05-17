import CanceledUpload from "../../Components/UploadItem/CanceledUpload.jsx";
import PreparingUpload from "../../Components/UploadItem/PreparingUpload.jsx";
import UploadingItem from "../../Components/UploadItem/UploadingItem.jsx";
import { useUpload, type UploadSession } from "../../context/UploadContext.tsx";
import styles from "./Upload.module.css";

const Upload = () => {
  const { uploadSessions } = useUpload();

  if (uploadSessions.length == 0) {
    return (
      <section className={styles["upload-page"]}>
        <p className={styles["empty"]}>Загрузки не найдены</p>
      </section>
    );
  }

  const preparingUploads = uploadSessions.filter(s => s.status == "preparing");
  const activeUploads = uploadSessions.filter(s => isSessionActive(s)).sort(sortActiveSessions);
  const canceledUploads = uploadSessions.filter(s => s.status == "cancel");

  function isSessionActive(sesion: UploadSession) {
    return (
      sesion.status == "sending" ||
      sesion.status == "canceling" ||
      sesion.status == "building" ||
      sesion.status == "complete"
    );
  }

  function sortActiveSessions(a: (typeof activeUploads)[0], b: (typeof activeUploads)[0]) {
    if (a.status == "complete" && b.status == "complete") {
      return +b.readyAt - +a.readyAt;
    }
    if (a.status == "complete") return 1;
    if (b.status == "complete") return -1;
    return 0;
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

        {canceledUploads.map(session => (
          <CanceledUpload session={session} key={session.id} />
        ))}
      </ul>
    </section>
  );
};

export default Upload;
