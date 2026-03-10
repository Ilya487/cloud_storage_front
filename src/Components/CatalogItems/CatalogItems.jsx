import useContextMenu from "../../hooks/useContextMenu";
import useOutsideHandle from "../../hooks/useOutsideHandle";
import CatalogItem from "../CatalogItem/CatalogItem";
import ItemContextMenu from "../ContextMenu/ItemContextMenu";
import useSelectMultipleCatalogItems from "../../hooks/useSelectMultipleCatalogItems";

const CatalogItems = ({ items, refreshFolder, path }) => {
  const {
    selectedItems,
    visualSelectedItems,
    handleClick,
    handleContextMenu: selectHandleContextMenu,
    clearSelect,
  } = useSelectMultipleCatalogItems();

  const { isOpen: isMenuOpen, position, closeMenu, handleContextMenu } = useContextMenu();
  const itemsListRef = useOutsideHandle(["contextmenu", "click"], () => {
    closeMenu();
    clearSelect();
  });

  function clickHandle(e, catalogItem) {
    handleClick(e, catalogItem);
    closeMenu();
  }

  function contextMenuHandler(e, catalogItem) {
    handleContextMenu(e);
    selectHandleContextMenu(catalogItem);
  }

  return (
    <>
      <ul
        ref={itemsListRef}
        onClick={e => {
          if (e.ctrlKey) return;
          clearSelect();
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
        itemsCurrentPath={path}
        onRename={refreshFolder}
        onDelete={refreshFolder}
        contextMenuVisible={isMenuOpen}
      />
    </>
  );
};

export default CatalogItems;
