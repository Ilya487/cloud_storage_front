import { forwardRef } from "react";
import styles from "./ModalWindow.module.css";

const ModalWindow = forwardRef(function ModalWindow({ children }, ref) {
  return (
    <>
      <div className={styles.overlay}></div>
      <div className={styles["modal-container"]} ref={ref}>
        {children}
      </div>
    </>
  );
});

export default ModalWindow;
