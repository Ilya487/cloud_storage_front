import ContextMenu from "./ContextMenu";
import RenameDialog from "../RenameDialog/RenameDialog";
import DeleteDialog from "../DeleteDialog/DeleteDialog";
import MoveDialog from "../MoveDialog/MoveDialog";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";
import useMenuActions from "./useMenuActions";
import { downloadDirOrMany, downloadFile } from "../../API/downloadService";

const ItemContextMenu = ({
  items,
  itemsCurrentPath,
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

  const { handleOptionClick, disableActiveOptions, optionsVisible } = useMenuActions({
    rename: false,
    delete: false,
    move: false,
  });

  async function download() {
    if (items.length == 1 && items[0].type == "file") {
      downloadFile(items[0].id);
      return;
    }

    const dowloadIds = items.map(item => item.id);
    const pendingMessage = "Подготовка архива";

    toast.promise(
      downloadDirOrMany(dowloadIds),
      {
        pending: pendingMessage,
        error: {
          render({ data }) {
            return data.message;
          },
        },
      },
      {
        position: "top-center",
      },
    );
  }

  return (
    <>
      {contextMenuVisible &&
        createPortal(
          <ContextMenu coords={coords}>
            {items.length == 1 && (
              <li className="context-menu__item" onClick={() => handleOptionClick("rename", true)}>
                Переименовать
              </li>
            )}
            <li className="context-menu__item" onClick={() => download()}>
              Скачать
            </li>
            <li className="context-menu__item" onClick={() => handleOptionClick("move", true)}>
              Переместить
            </li>
            <li className="context-menu__item" onClick={() => handleOptionClick("delete", true)}>
              Удалить
            </li>
          </ContextMenu>,
          document.body,
        )}

      {optionsVisible.rename && (
        <RenameDialog
          type={items[0].type}
          objectId={items[0].id}
          defaultName={items[0].name}
          onRename={onRename}
          onClose={updatedOnClose}
        />
      )}
      {optionsVisible.delete && (
        <DeleteDialog items={items} onClose={updatedOnClose} onDelete={onDelete} />
      )}
      {optionsVisible.move && (
        <MoveDialog items={items} itemsCurrentPath={itemsCurrentPath} onClose={updatedOnClose} />
      )}
    </>
  );
};

export default ItemContextMenu;
