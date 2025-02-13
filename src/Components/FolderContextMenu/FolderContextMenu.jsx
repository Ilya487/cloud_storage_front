import { useEffect, useState } from "react";
import ContextMenu from "../ContextMenu/ContextMenu";
import RenameDialog from "../RenameDialog/RenameDialog";
import DeleteDialog from "../DeleteDialog/DeleteDialog";
import MoveDialog from "../MoveDialog/MoveDialog";

const FolderContextMenu = ({
  item,
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
    move: false,
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
    { label: "Переместить", action: () => handleOptionClick("move", true) },
    { label: "Удалить", action: () => handleOptionClick("delete", true) },
  ];

  return (
    <>
      {contextMenuVisible && (
        <ContextMenu menuOptions={optionsSettings} coords={coords} />
      )}
      {optionsVisible.rename && (
        <RenameDialog
          dirId={item.id}
          defaultName={item.name}
          onRename={onRename}
          onClose={updatedOnClose}
        />
      )}
      {optionsVisible.delete && (
        <DeleteDialog
          name={item.name}
          dirId={item.id}
          onClose={updatedOnClose}
          onDelete={onDelete}
        />
      )}
      {optionsVisible.move && (
        <MoveDialog
          onClose={updatedOnClose}
          itemName={item.name}
          itemId={item.id}
          itemPath={item.path}
        />
      )}
    </>
  );
};

export default FolderContextMenu;
