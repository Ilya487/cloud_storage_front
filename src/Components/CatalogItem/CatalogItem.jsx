import { useNavigate, useParams } from "react-router";
import styles from "./CatalogItem.module.css";
import { FaFile, FaFolder } from "react-icons/fa";
import useOutsideHandle from "../../hooks/useOutsideHandle";
import { useRefreshFolderContent } from "../../API/fileSystemService";
import useContextMenu from "../../hooks/useContextMenu";
import ItemContextMenu from "../ItemContextMenu/ItemContextMenu";
import clsx from "clsx";

const CatalogItem = ({ catalogItem }) => {
  const { id, name, type, created_at, size } = catalogItem;
  const { dirId } = useParams();
  const { isOpen: cntxMenuVisible, position, closeMenu, handleContextMenu } = useContextMenu();
  const navigator = useNavigate();
  const refreshFolder = useRefreshFolderContent(dirId);

  function openFolder() {
    if (type != "folder") return;

    const currentPath = window.location.pathname;
    const updatedPath = currentPath.replace(dirId, id);

    navigator(updatedPath);
  }

  const folderRef = useOutsideHandle(["click", "contextmenu"], () => closeMenu());

  return (
    <>
      <li
        onDoubleClick={openFolder}
        className={clsx(
          styles["catalog-item"],
          cntxMenuVisible && styles["catalog-item--selected"]
        )}
        onContextMenu={handleContextMenu}
        ref={folderRef}
        onClick={() => closeMenu()}
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
        <div>{size ? size : "—"}</div>
      </li>

      <ItemContextMenu
        coords={position}
        item={catalogItem}
        onRename={refreshFolder}
        onDelete={refreshFolder}
        contextMenuVisible={cntxMenuVisible}
      />
    </>
  );
};

export default CatalogItem;
