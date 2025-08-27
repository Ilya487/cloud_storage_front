import { useParams } from "react-router";
import { useFolderContent, useRefreshFolderContent } from "../../API/fileSystemService";
import useContextMenu from "../../hooks/useContextMenu";
import CatalogContextMenu from "../../Components/ContextMenu/CatalogContextMenu";
import useOutsideHandle from "../../hooks/useOutsideHandle";
import styles from "./Catalog.module.css";
import clsx from "clsx";
import { useState } from "react";
import PathNavigator from "../../Components/PathNavigator/PathNavigator";
import useFilteredCatalog from "./useFilteredCatalog";
import CatalogFilter from "../../Components/CatalogFilter/CatalogFilter";
import useFileDrop from "../../hooks/useFileDrop";
import CatalogItems from "../../Components/CatalogItems/CatalogItems";

const Catalog = () => {
  const { dirId } = useParams();
  const { data, isPending } = useFolderContent(dirId);
  const { isOpen, position, closeMenu, handleContextMenu } = useContextMenu();
  const catalogRef = useOutsideHandle(["click", "contextmenu"], () => closeMenu(), false, false);
  const refreshFolder = useRefreshFolderContent(dirId);

  const [filterSetup, setFilterSetup] = useState({
    name: false,
    date: true,
    size: false,
    ascending: true,
  });
  const filteredCatalog = useFilteredCatalog(data?.contents, filterSetup);
  const { handleDrop, handleOver, handleLeave, canBeDrop } = useFileDrop(dirId);

  if (isPending) return <p>Загрузка...</p>;
  return (
    <>
      <section
        onContextMenu={handleContextMenu}
        ref={catalogRef}
        onClick={() => closeMenu()}
        className={clsx(styles.catalog, canBeDrop === true && styles["catalog-drag-over"])}
        onDrop={handleDrop}
        onDragLeave={handleLeave}
        onDragOver={handleOver}
      >
        <PathNavigator path={data.path} />
        {filteredCatalog?.length > 0 && (
          <CatalogFilter filterSetup={filterSetup} setFilterSetup={setFilterSetup} />
        )}
        {filteredCatalog?.length > 0 && (
          <CatalogItems items={filteredCatalog} dirId={dirId} path={data.path} />
        )}

        {data.contents.length == 0 && <p className={styles["empty-dir"]}>{"Эта папка пуста."}</p>}
      </section>
      {
        <CatalogContextMenu
          dirId={dirId}
          coords={position}
          contextMenuVisible={isOpen}
          onClose={() => closeMenu()}
          onFolderCreate={refreshFolder}
        />
      }
    </>
  );
};

export default Catalog;
