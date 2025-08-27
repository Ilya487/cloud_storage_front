import { useState } from "react";
import useContextMenu from "../../hooks/useContextMenu";
import useOutsideHandle from "../../hooks/useOutsideHandle";
import CatalogItem from "../CatalogItem/CatalogItem";
import { useRefreshFolderContent } from "../../API/fileSystemService";
import ItemContextMenu from "../ContextMenu/ItemContextMenu";

const CatalogItems = ({ items, dirId }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [visualSelectedItems, setVisualSelectedItems] = useState([]);
  const refreshFolder = useRefreshFolderContent(dirId);

  const { isOpen: isMenuOpen, position, closeMenu, handleContextMenu } = useContextMenu();
  const itemsListRef = useOutsideHandle(["contextmenu", "click"], () => {
    closeMenu();
    setVisualSelectedItems([]);
  });

  function clickHandle(e, catalogItem) {
    const id = catalogItem.id;

    if (visualSelectedItems.includes(id) && e.ctrlKey) {
      const updatedIds = visualSelectedItems.filter(val => val != id);
      const updatedItems = selectedItems.filter(item => item.id != id);
      setVisualSelectedItems(updatedIds);
      setSelectedItems(updatedItems);
      closeMenu();
      return;
    }

    if (e.ctrlKey) {
      closeMenu();
      setVisualSelectedItems([...visualSelectedItems, id]);

      if (visualSelectedItems.length == 0) {
        setSelectedItems([catalogItem]);
      } else setSelectedItems([...selectedItems, catalogItem]);

      return;
    }

    setVisualSelectedItems([]);
    closeMenu();
  }

  function contextMenuHandler(e, catalogItem) {
    handleContextMenu(e);

    if (visualSelectedItems.length > 1 && visualSelectedItems.includes(catalogItem.id)) return;

    setSelectedItems([catalogItem]);
    setVisualSelectedItems([catalogItem.id]);
  }

  return (
    <>
      <ul
        ref={itemsListRef}
        onClick={e => {
          if (e.ctrlKey) return;
          setVisualSelectedItems([]);
        }}
      >
        {items.map(item => (
          <CatalogItem
            key={item.id}
            catalogItem={item}
            isSelected={visualSelectedItems.includes(item.id)}
            handleContextMenu={e => contextMenuHandler(e, item)}
            clickHandle={clickHandle}
          />
        ))}
      </ul>
      <ItemContextMenu
        coords={position}
        items={selectedItems}
        onRename={() => refreshFolder(dirId)}
        onDelete={() => refreshFolder(dirId)}
        contextMenuVisible={isMenuOpen}
      />
    </>
  );
};

export default CatalogItems;
