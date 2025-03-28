import { IoMdCloseCircleOutline } from "react-icons/io";
import styles from "./CancelBtn.module.css";

const CancelBtn = args => {
  return <IoMdCloseCircleOutline className={styles.cancel} {...args} />;
};

export default CancelBtn;
