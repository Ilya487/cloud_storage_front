import { TiCloudStorage } from "react-icons/ti";
import styles from "./MoveDialog.module.css";
import clsx from "clsx";
import FolderIcon from "../Icons/FolderIcon";

const CatalogList = ({ catalog, onSelect, onMoveInDir, selectedDirId, showMoveToRoot }) => {
  return (
    <ul className={styles["dir-list"]}>
      {catalog.map(item => (
        <li
          key={item.id}
          onClick={() => onSelect(item.id)}
          onDoubleClick={() => onMoveInDir(item.id)}
          className={clsx(
            styles["catalog-item"],
            item.id == selectedDirId && styles["catalog-item--selected"],
          )}
        >
          <FolderIcon size={35} className={styles["dir-icon"]} />
          <span>{item.name}</span>
        </li>
      ))}
      {showMoveToRoot && (
        <li
          onClick={() => onSelect("root")}
          className={clsx(
            styles["catalog-item"],
            selectedDirId == "root" && styles["catalog-item--selected"],
          )}
        >
          <TiCloudStorage size={35} color="#3030e7" className={styles["dir-icon"]} />
          <span>Мой диск</span>
        </li>
      )}
    </ul>
  );
};

export default CatalogList;
