import { useEffect, useState } from "react";
import ContextMenu from "../ContextMenu/ContextMenu";
import RenameDialog from "../RenameDialog/RenameDialog";
import DeleteDialog from "../DeleteDialog/DeleteDialog";

const FolderContextMenu = ({
  dirId,
  defaultName,
  onRename,
  onDelete,
  onClose,
  coords,
  contextMenuVisible,
}) => {
  const updatedOnClose = () => {
    disableActiveOptions();
    onClose && onClose();
  };

  const [optionsVisible, setOptionsVisible] = useState({
    rename: false,
    delete: false,
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

  const optionsSettings = [
    {
      label: "Переименовать",
      action: () => handleOptionClick("rename", true),
    },
    { label: "Скачать" },
    { label: "Переместить" },
    { label: "Удалить", action: () => handleOptionClick("delete", true) },
  ];

  return (
    <>
      {contextMenuVisible && (
        <ContextMenu menuOptions={optionsSettings} coords={coords} />
      )}
      {optionsVisible.rename && (
        <RenameDialog
          dirId={dirId}
          defaultName={defaultName}
          onRename={onRename}
          onClose={updatedOnClose}
        />
      )}
      {optionsVisible.delete && (
        <DeleteDialog
          name={defaultName}
          dirId={dirId}
          onClose={updatedOnClose}
          onDelete={onDelete}
        />
      )}
    </>
  );
};

export default FolderContextMenu;
