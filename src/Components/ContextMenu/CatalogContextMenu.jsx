import { useRef } from "react";
import ContextMenu from "../ContextMenu/ContextMenu";
import CreateFolderDialog from "../CreateFolderDialog/CreateFolderDialog";
import { useUpload } from "../../context/UploadContext";
import { useNavigate } from "react-router";
import useMenuActions from "./useMenuActions";

const CatalogContextMenu = ({ onClose, contextMenuVisible, coords, dirId, onFolderCreate }) => {
  const updatedOnClose = () => {
    disableActiveOptions();
    onClose && onClose();
  };

  const { handleOptionClick, disableActiveOptions, optionsVisible } = useMenuActions({
    createFolder: false,
    uploadFiles: false,
  });
  const { addUploads } = useUpload();
  const navigate = useNavigate();

  function handleUpload(e) {
    const files = e.target.files;
    addUploads([...files], dirId);
    navigate("/upload");
  }
  const fileSelector = useRef();
  function trigerFileSelector() {
    fileSelector.current.click();
  }

  return (
    <>
      {contextMenuVisible && (
        <ContextMenu coords={coords}>
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
