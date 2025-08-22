import { useState } from "react";
import useContextMenu from "../../hooks/useContextMenu";
import useOutsideHandle from "../../hooks/useOutsideHandle";
import CatalogItem from "../CatalogItem/CatalogItem";
import { useRefreshFolderContent } from "../../API/fileSystemService";
import ItemContextMenu from "../ItemContextMenu/ItemContextMenu";

const CatalogItems = ({ items, dirId }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedItemsIds, setSelectedItemsIds] = useState([]);
  const refreshFolder = useRefreshFolderContent(dirId);

  const itemContextMenu = useContextMenu();
  const itemsListRef = useOutsideHandle(["contextmenu"], () => {
    itemContextMenu.closeMenu();
    setSelectedItemsIds([]);
  });

  return (
    <ul ref={itemsListRef}>
      {items.map(item => (
        <CatalogItem
          key={item.id}
          catalogItem={item}
          isSelected={selectedItemsIds.includes(item.id)}
          closeMenu={() => {
            itemContextMenu.closeMenu();
            setSelectedItemsIds([]);
          }}
          handleContextMenu={e => {
            setSelectedItems([item]);
            setSelectedItemsIds([item.id]);
            itemContextMenu.handleContextMenu(e);
          }}
        />
      ))}

      <ItemContextMenu
        coords={itemContextMenu.position}
        item={selectedItems[0]}
        onRename={() => refreshFolder(dirId)}
        onDelete={() => refreshFolder(dirId)}
        contextMenuVisible={itemContextMenu.isOpen}
      />
    </ul>
  );
};

export default CatalogItems;
