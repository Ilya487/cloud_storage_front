import { useTrashContent } from "../../API/trashService";
import TrashContextMenu from "../../Components/ContextMenu/TrashContextMenu";
import FileIcon from "../../Components/Icons/FileIcon";
import FolderIcon from "../../Components/Icons/FolderIcon";
import useContextMenu from "../../hooks/useContextMenu";
import useOutsideHandle from "../../hooks/useOutsideHandle";
import clsx from "clsx";
import DeleteDialog from "../../Components/DeleteDialog/DeleteDialog";
import useFilteredCatalog from "../Catalog/useFilteredCatalog";
import useSelectMultipleCatalogItems from "../../hooks/useSelectMultipleCatalogItems";
import CatalogItemsFilter from "../../Components/UI/CatalogItemsFilter";
import Spinner from "../../Components/Spinner/Spinner";

const Trash = () => {
  const { data, isLoading } = useTrashContent();
  const { isOpen, position, closeMenu, handleContextMenu } = useContextMenu();
  const itemsListRef = useOutsideHandle(["contextmenu", "click"], () => {
    closeMenu();
    clearSelect();
  });

  const {
    filteredCatalog: filteredTrash,
    changeFilter,
    filterSetup,
  } = useFilteredCatalog(data, false, "deleteDate");

  const {
    selectedItems,
    visualSelectedItems,
    handleClick: selectClickHanlder,
    handleContextMenu: selectHandleContextMenu,
    clearSelect,
  } = useSelectMultipleCatalogItems();

  function contextMenuHanlde(e, item) {
    handleContextMenu(e);
    selectHandleContextMenu(item);
  }

  function handleClick(e, item) {
    closeMenu();
    selectClickHanlder(e, item);
  }

  return (
    <>
      <h1 className="text-4xl mb-5">Корзина</h1>
      {isLoading && <Spinner />}
      {filteredTrash && (
        <ul ref={itemsListRef}>
          <li className="grid grid-cols-[4fr_4fr_2fr] p-1.5">
            <CatalogItemsFilter
              text="Название"
              visible={filterSetup.name}
              onClick={() => changeFilter("name")}
              ascending={filterSetup.ascending}
            />
            <div>Путь</div>
            <CatalogItemsFilter
              text="Дата удаления"
              visible={filterSetup.deleteDate}
              onClick={() => changeFilter("deleteDate")}
              ascending={filterSetup.ascending}
            />
          </li>
          {filteredTrash?.map(item => (
            <li
              className={clsx(
                "p-1.5 grid grid-cols-[4fr_4fr_2fr] items-center rounded-sm hover:bg-neutral-500",
                visualSelectedItems.includes(item.id) && "bg-neutral-500",
              )}
              key={item.id}
              onClick={e => handleClick(e, item)}
              onContextMenu={e => contextMenuHanlde(e, item)}
            >
              <div className="flex gap-2 items-center">
                {item.type == "folder" ? (
                  <FolderIcon className="w-9 h-9 mr-3" />
                ) : (
                  <FileIcon className="w-9 h-9 mr-3" />
                )}
                <p className="truncate" title={item.name}>
                  {item.name}
                </p>
              </div>
              <p className="truncate" title={item.path}>
                {item.path}
              </p>
              <p>{item.deleted_at}</p>
            </li>
          ))}
        </ul>
      )}
      <TrashContextMenu coords={position} contextMenuVisible={isOpen} />
      {/* <DeleteDialog items={[selectedItem]} /> */}
    </>
  );
};

export default Trash;
