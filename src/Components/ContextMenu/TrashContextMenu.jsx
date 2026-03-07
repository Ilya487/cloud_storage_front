import ContextMenu from "../ContextMenu/ContextMenu";
import DeleteDialog from "../DeleteDialog/DeleteDialog";
import { useNavigate } from "react-router";

const TrashContextMenu = ({ contextMenuVisible, coords }) => {
  //   const updatedOnClose = () => {
  //     disableActiveOptions();
  //     onClose && onClose();
  //   };
  //   const navigate = useNavigate();

  return (
    <>
      {contextMenuVisible && (
        <ContextMenu coords={coords}>
          <li className="context-menu__item">Восстановить</li>
          <li className="context-menu__item">Удалить</li>
        </ContextMenu>
      )}

      {/* {optionsVisible.createFolder && <DeleteDialog />} */}
    </>
  );
};

export default TrashContextMenu;
