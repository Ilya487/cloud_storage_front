import { useEffect, useState } from "react";
import ContextMenu from "../ContextMenu/ContextMenu";
import RenameDialog from "../RenameDialog/RenameDialog";

const FolderContextMenu = ({
  dirId,
  defaultName,
  onRename,
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

  useEffect(disableActiveOptions, []);

  const optionsSettings = [
    {
      label: "Переименовать",
      action: () => handleOptionClick("rename", true),
    },
    { label: "Скачать" },
    { label: "Переместить" },
    { label: "Удалить" },
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
    </>
  );
};

export default FolderContextMenu;
