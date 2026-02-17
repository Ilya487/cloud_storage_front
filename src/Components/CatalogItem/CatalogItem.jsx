import { useNavigate, useParams } from "react-router";
import styles from "./CatalogItem.module.css";
import clsx from "clsx";
import fileSizeDisplay from "../../utils/fileSizeDisplay";
import FolderIcon from "../Icons/FolderIcon";
import FileIcon from "../Icons/FileIcon";
import { displayFile } from "../../API/fileSystemService";

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

  function handleClick() {
    if (type == "folder") {
      openFolder();
      return;
    }
    displayFile(id, name);
  }

  return (
    <li
      onDoubleClick={handleClick}
      className={clsx(
        "cursor-pointer rounded-sm",
        styles["catalog-item"],
        isSelected && styles["catalog-item--selected"],
      )}
      onContextMenu={handleContextMenu}
      onClick={e => clickHandle(e, catalogItem)}
    >
      <div className={styles.filename} title={name}>
        {type == "folder" ? (
          <FolderIcon className={styles.icon} />
        ) : (
          <FileIcon className={styles.icon} />
        )}
        <span>{name}</span>
      </div>
      <div>{created_at}</div>
      <div>{size ? fileSizeDisplay(size) : "—"}</div>
    </li>
  );
};

export default CatalogItem;
