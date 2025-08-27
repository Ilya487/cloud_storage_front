import ContextMenu from "./ContextMenu";
import RenameDialog from "../RenameDialog/RenameDialog";
import DeleteDialog from "../DeleteDialog/DeleteDialog";
import MoveDialog from "../MoveDialog/MoveDialog";
import { downloadObject } from "../../API/fileSystemService";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";
import useMenuActions from "./useMenuActions";

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
    const dowloadIds = items.map(item => item.id);
    const toastText = { pending: "", error: "" };

    if (items.length > 1) {
      toastText.pending = `Подготовка к загрузке (${items.length}) объектов`;
      toastText.error = `Не удалось загрузить запрашиваемые объкты`;
    } else {
      toastText.pending = `Подготовка к загрузке "${items[0].name}"`;
      toastText.error = `Не удалось загрузить "${items[0].name}"`;
    }

    toast.promise(
      downloadObject(dowloadIds),
      {
        pending: toastText.pending,
        error: toastText.error,
      },
      {
        position: "top-center",
      }
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
          document.body
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
