import { useState } from "react";
import useContextMenu from "../../hooks/useContextMenu";
import useOutsideHandle from "../../hooks/useOutsideHandle";
import CatalogItem from "../CatalogItem/CatalogItem";
import { useRefreshFolderContent } from "../../API/fileSystemService";
import ItemContextMenu from "../ContextMenu/ItemContextMenu";

const CatalogItems = ({ items, dirId }) => {
  const [selectedItem, setSelectedItem] = useState();
  const [selectedItemsIds, setSelectedItemsIds] = useState([]);
  const refreshFolder = useRefreshFolderContent(dirId);

  const { isOpen: isMenuOpen, position, closeMenu, handleContextMenu } = useContextMenu();
  const itemsListRef = useOutsideHandle(["contextmenu", "click"], () => {
    closeMenu();
    setSelectedItemsIds([]);
  });

  function clickHandle(e, id) {
    if (selectedItemsIds.includes(id) && e.ctrlKey) {
      const updatedIds = selectedItemsIds.filter(val => val != id);
      setSelectedItemsIds(updatedIds);
      closeMenu();
      return;
    }

    if (e.ctrlKey) {
      closeMenu();
      setSelectedItemsIds([...selectedItemsIds, id]);
      return;
    }

    setSelectedItemsIds([]);
    closeMenu();
  }

  function contextMenuHandler(e, catalogItem) {
    handleContextMenu(e);

    if (selectedItemsIds.length > 1 && selectedItemsIds.includes(catalogItem.id)) return;

    setSelectedItem(catalogItem);
    setSelectedItemsIds([catalogItem.id]);
  }

  return (
    <ul
      ref={itemsListRef}
      onClick={e => {
        if (e.ctrlKey) return;
        setSelectedItemsIds([]);
      }}
    >
      {items.map(item => (
        <CatalogItem
          key={item.id}
          catalogItem={item}
          isSelected={selectedItemsIds.includes(item.id)}
          handleContextMenu={e => contextMenuHandler(e, item)}
          clickHandle={clickHandle}
        />
      ))}

      <ItemContextMenu
        coords={position}
        item={selectedItem}
        onRename={() => refreshFolder(dirId)}
        onDelete={() => refreshFolder(dirId)}
        contextMenuVisible={isMenuOpen}
      />
    </ul>
  );
};

export default CatalogItems;
