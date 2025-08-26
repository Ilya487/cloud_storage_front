import ContextMenu from "./ContextMenu";
import RenameDialog from "../RenameDialog/RenameDialog";
import DeleteDialog from "../DeleteDialog/DeleteDialog";
import MoveDialog from "../MoveDialog/MoveDialog";
import { downloadObject } from "../../API/fileSystemService";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";
import useMenuActions from "./useMenuActions";

const ItemContextMenu = ({ item, onRename, onDelete, onClose, coords, contextMenuVisible }) => {
  const updatedOnClose = () => {
    disableActiveOptions();
    onClose && onClose();
  };

  const { handleOptionClick, disableActiveOptions, optionsVisible } = useMenuActions({
    rename: false,
    delete: false,
    move: false,
  });

  async function download(id) {
    toast.promise(
      downloadObject([id]),
      {
        pending: `Подготовка к загрузке "${item.name}"`,
        error: `Не удалось загрузить "${item.name}"`,
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
            <li className="context-menu__item" onClick={() => handleOptionClick("rename", true)}>
              Переименовать
            </li>
            <li className="context-menu__item" onClick={() => download(item.id)}>
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
          type={item.type}
          objectId={item.id}
          defaultName={item.name}
          onRename={onRename}
          onClose={updatedOnClose}
        />
      )}
      {optionsVisible.delete && (
        <DeleteDialog
          name={item.name}
          objectId={item.id}
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

export default ItemContextMenu;
