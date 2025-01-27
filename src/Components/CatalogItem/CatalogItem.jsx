import { useNavigate, useParams } from "react-router";
import styles from "./CatalogItem.module.css";
import { FaFolder } from "react-icons/fa";
import ContextMenu from "../ContextMenu/ContextMenu";
import { useState } from "react";
import useOutsideHandle from "../../hooks/useOutsideHandle";
import RenameDialog from "../RenameDialog/RenameDialog";

const CatalogItem = ({ catalogItem }) => {
  const { id, name, type } = catalogItem;
  const pathParams = useParams();
  const [cntxMenuVisible, setCntxMenuVisible] = useState(false);
  const [clickCoord, setClickCoord] = useState();
  const navigator = useNavigate();

  function openFolder() {
    const currentPath = window.location.pathname;
    const updatedPath = currentPath.replace(pathParams.dirId, id);

    navigator(updatedPath);
  }

  function handleContextMenu(e) {
    e.preventDefault();

    const x = e.clientX;
    const y = e.clientY;
    setClickCoord({ x, y });
    setCntxMenuVisible(true);
  }

  const zxc = [
    { label: "Переименовать" },
    { label: "Скачать" },
    { label: "Переместить" },
    { label: "Удалить" },
  ];

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
      >
        {type == "folder" && <FaFolder size={65} color="#3030e7" />}
        {type == "file" && <p>{"Файл!"}</p>}
        <span>{name}</span>
        {cntxMenuVisible && (
          <ContextMenu menuOptions={zxc} coords={clickCoord} />
        )}
      </div>
      <RenameDialog defaultName={name} />
    </>
  );
};

export default CatalogItem;
