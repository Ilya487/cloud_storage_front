import { useState } from "react";
import ContextMenu from "../ContextMenu/ContextMenu";
import CreateFolderDialog from "../CreateFolderDialog/CreateFolderDialog";

const CatalogContextMenu = ({
  onClose,
  contextMenuVisible,
  coords,
  dirId,
  onFolderCreate,
}) => {
  const updatedOnClose = () => {
    disableActiveOptions();
    onClose && onClose();
  };

  const [optionsVisible, setOptionsVisible] = useState({
    createFolder: false,
  });

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
          <li className="context-menu__item">Загрузить файлы</li>
        </ContextMenu>
      )}
      {optionsVisible.createFolder && (
        <CreateFolderDialog
          onClose={updatedOnClose}
          dirId={dirId}
          onFolderCreate={onFolderCreate}
        />
      )}
    </>
  );
};

export default CatalogContextMenu;
