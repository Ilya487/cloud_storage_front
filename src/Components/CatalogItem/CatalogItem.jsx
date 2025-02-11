import { useNavigate, useParams } from "react-router";
import styles from "./CatalogItem.module.css";
import { FaFolder } from "react-icons/fa";
import useOutsideHandle from "../../hooks/useOutsideHandle";
import { useRefreshFolderContent } from "../../API/fileSystemService";
import FolderContextMenu from "../FolderContextMenu/FolderContextMenu";
import useContextMenu from "../../hooks/useContextMenu";

const CatalogItem = ({ catalogItem }) => {
  const { id, name, type } = catalogItem;
  const pathParams = useParams();
  const {
    isOpen: cntxMenuVisible,
    position,
    closeMenu,
    handleContextMenu,
  } = useContextMenu();
  const navigator = useNavigate();
  const refreshFolder = useRefreshFolderContent(pathParams.dirId);

  function openFolder() {
    const currentPath = window.location.pathname;
    const updatedPath = currentPath.replace(pathParams.dirId, id);

    navigator(updatedPath);
  }

  const folderRef = useOutsideHandle(["click", "contextmenu"], () =>
    closeMenu()
  );

  return (
    <>
      <div
        onDoubleClick={openFolder}
        className={styles["folder-wrap"]}
        onContextMenu={handleContextMenu}
        ref={folderRef}
        onClick={() => closeMenu()}
      >
        {type == "folder" && <FaFolder size={65} color="#3030e7" />}
        {type == "file" && <p>{"Файл!"}</p>}
        <span>{name}</span>
      </div>
      {type == "folder" && (
        <FolderContextMenu
          coords={position}
          item={catalogItem}
          onRename={refreshFolder}
          onDelete={refreshFolder}
          contextMenuVisible={cntxMenuVisible}
        />
      )}
    </>
  );
};

export default CatalogItem;
