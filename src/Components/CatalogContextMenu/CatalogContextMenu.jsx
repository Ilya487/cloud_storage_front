import { useRef, useState } from "react";
import ContextMenu from "../ContextMenu/ContextMenu";
import CreateFolderDialog from "../CreateFolderDialog/CreateFolderDialog";
import { useUpload } from "../../context/UploadContext";
import { useNavigate } from "react-router";

const CatalogContextMenu = ({ onClose, contextMenuVisible, coords, dirId, onFolderCreate }) => {
  const updatedOnClose = () => {
    disableActiveOptions();
    onClose && onClose();
  };

  const [optionsVisible, setOptionsVisible] = useState({
    createFolder: false,
    uploadFiles: false,
  });
  const { addUploads } = useUpload();
  const navigator = useNavigate();

  function handleOptionClick(option, value) {
    setOptionsVisible({ ...optionsVisible, [option]: value });
  }

  function disableActiveOptions() {
    const updatedState = { ...optionsVisible };
    for (const option in updatedState) {
      updatedState[option] = false;
    }

    setOptionsVisible(updatedState);
  }

  function handleUpload(e) {
    const files = e.target.files;
    addUploads(files, dirId);
    navigator("/upload");
  }
  const fileSelector = useRef();
  function trigerFileSelector() {
    fileSelector.current.click();
  }

  return (
    <>
      {contextMenuVisible && (
        <ContextMenu coords={coords}>
          {/* <ContextMenu coords={coords} className={clsx(!contextMenuVisible && styles["menu-hide"])}> */}
          <li
            className="context-menu__item"
            onClick={() => handleOptionClick("createFolder", true)}
          >
            Создать папку
          </li>
          <li className="context-menu__item" onClick={trigerFileSelector}>
            Загрузить файлы
          </li>
        </ContextMenu>
      )}

      {optionsVisible.createFolder && (
        <CreateFolderDialog
          onClose={updatedOnClose}
          dirId={dirId}
          onFolderCreate={onFolderCreate}
        />
      )}

      <input type="file" multiple onChange={handleUpload} ref={fileSelector} hidden />
    </>
  );
};

export default CatalogContextMenu;
