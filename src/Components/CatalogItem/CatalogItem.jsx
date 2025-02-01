import { useNavigate, useParams } from "react-router";
import styles from "./CatalogItem.module.css";
import { FaFolder } from "react-icons/fa";
import { useState } from "react";
import useOutsideHandle from "../../hooks/useOutsideHandle";
import { useRefreshFolderContent } from "../../API/fileSystemService";
import FolderContextMenu from "../FolderContextMenu/FolderContextMenu";

const CatalogItem = ({ catalogItem }) => {
  const { id, name, type } = catalogItem;
  const pathParams = useParams();
  const [cntxMenuVisible, setCntxMenuVisible] = useState(false);
  const [contextMenuEvent, setContextMenuEvent] = useState();
  const navigator = useNavigate();
  const refreshFolder = useRefreshFolderContent(pathParams.dirId);

  function openFolder() {
    const currentPath = window.location.pathname;
    const updatedPath = currentPath.replace(pathParams.dirId, id);

    navigator(updatedPath);
  }

  function handleContextMenu(e) {
    setContextMenuEvent(e);
    setCntxMenuVisible(true);
  }

  const folderRef = useOutsideHandle(["click", "contextmenu"], () =>
    setCntxMenuVisible(false)
  );

  return (
    <>
      <div
        onDoubleClick={openFolder}
        className={styles["folder-wrap"]}
        onContextMenu={handleContextMenu}
        ref={folderRef}
        onClick={() => setCntxMenuVisible(false)}
      >
        {type == "folder" && <FaFolder size={65} color="#3030e7" />}
        {type == "file" && <p>{"Файл!"}</p>}
        <span>{name}</span>
      </div>
      {type == "folder" && (
        <FolderContextMenu
          contextMenuEvent={contextMenuEvent}
          defaultName={name}
          dirId={id}
          onRename={refreshFolder}
          contextMenuVisible={cntxMenuVisible}
        />
      )}
    </>
  );
};

export default CatalogItem;
