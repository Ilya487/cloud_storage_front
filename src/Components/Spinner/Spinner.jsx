import clsx from "clsx";
import styles from "./Spinner.module.css";
import Svg from "./Spinner.svg";

const Spinner = props => {
  return (
    <div {...props} className={clsx(styles.wrap, props.className)}>
      <img src={Svg} alt="loader" className={styles.spinner} />
    </div>
  );
};

export default Spinner;
