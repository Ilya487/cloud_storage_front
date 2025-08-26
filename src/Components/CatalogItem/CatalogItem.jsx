import { useNavigate, useParams } from "react-router";
import styles from "./CatalogItem.module.css";
import { FaFile, FaFolder } from "react-icons/fa";
import clsx from "clsx";
import fileSizeDisplay from "../../utils/fileSizeDisplay";

const CatalogItem = ({ catalogItem, handleContextMenu, isSelected, clickHandle }) => {
  const { id, name, type, created_at, size } = catalogItem;
  const { dirId } = useParams();
  const navigator = useNavigate();

  function openFolder() {
    if (type != "folder") return;

    const currentPath = window.location.pathname;
    const updatedPath = currentPath.replace(dirId, id);

    navigator(updatedPath);
  }

  return (
    <li
      onDoubleClick={openFolder}
      className={clsx(styles["catalog-item"], isSelected && styles["catalog-item--selected"])}
      onContextMenu={handleContextMenu}
      onClick={e => clickHandle(e, catalogItem.id)}
    >
      <div className={styles.filename} title={name}>
        {type == "folder" ? (
          <FaFolder color="#3030e7" className={styles.icon} />
        ) : (
          <FaFile color="#3030e7" className={styles.icon} />
        )}
        <span>{name}</span>
      </div>
      <div>{created_at}</div>
      <div>{size ? fileSizeDisplay(size) : "—"}</div>
    </li>
  );
};

export default CatalogItem;
