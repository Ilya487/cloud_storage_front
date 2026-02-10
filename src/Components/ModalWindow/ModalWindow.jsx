import { forwardRef, useEffect } from "react";
import styles from "./ModalWindow.module.css";

const ModalWindow = forwardRef(function ModalWindow({ children, closeCb, ...args }, ref) {
  function handleEsc(e) {
    if (e.code == "Escape") closeCb && closeCb();
  }

  useEffect(() => {
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <>
      <div className={"z-20 " + styles.overlay}></div>
      <div className={`${styles["modal-container"]} ${args.className || ""}`} ref={ref}>
        {children}
      </div>
    </>
  );
});

export default ModalWindow;
