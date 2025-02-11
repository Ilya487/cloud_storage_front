import { MdArrowBack } from "react-icons/md";
import styles from "./MoveDialog.module.css";
import clsx from "clsx";

const BackButton = ({ onBack, canGoBack }) => {
  return (
    <button
      onClick={onBack}
      className={clsx(styles.back, canGoBack == 0 && styles["back--hide"])}
    >
      <MdArrowBack size={20} />
    </button>
  );
};

export default BackButton;
