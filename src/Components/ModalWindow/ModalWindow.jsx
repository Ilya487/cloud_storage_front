import styles from "./ModalWindow.module.css";

const ModalWindow = ({ children }) => {
  return (
    <>
      <div className={styles.overlay}></div>
      <div className={styles["modal-container"]}>{children}</div>
    </>
  );
};

export default ModalWindow;
