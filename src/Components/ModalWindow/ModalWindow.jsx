import { forwardRef } from "react";
import styles from "./ModalWindow.module.css";

const ModalWindow = forwardRef(function ModalWindow(
  { children, ...args },
  ref
) {
  return (
    <>
      <div className={styles.overlay}></div>
      <div
        className={`${styles["modal-container"]} ${args.className || ""}`}
        ref={ref}
      >
        {children}
      </div>
    </>
  );
});

export default ModalWindow;
