import { useState } from "react";
import { useRestoreObjects } from "../../API/trashService";
import useErrorToast from "../../hooks/useErrorToast";
import ContextMenu from "../ContextMenu/ContextMenu";
import DeleteDialog from "../DeleteDialog/DeleteDialog";

const TrashContextMenu = ({ contextMenuVisible, coords, items }) => {
  const showErrorToast = useErrorToast();
  const { mutate } = useRestoreObjects();
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);

  function restoreObjects() {
    mutate(
      { itemsIds: items.map(item => item.id) },
      {
        onError: error => showErrorToast(error.message),
      },
    );
  }

  return (
    <>
      {contextMenuVisible && (
        <ContextMenu coords={coords}>
          <li className="context-menu__item" onClick={restoreObjects}>
            Восстановить
          </li>
          <li className="context-menu__item" onClick={() => setIsDeleteDialogVisible(true)}>
            Удалить
          </li>
        </ContextMenu>
      )}

      {isDeleteDialogVisible && (
        <DeleteDialog items={items} onClose={() => setIsDeleteDialogVisible(false)} />
      )}
    </>
  );
};

export default TrashContextMenu;
