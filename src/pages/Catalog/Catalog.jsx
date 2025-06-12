import { useNavigate, useParams } from "react-router";
import { useFolderContent, useRefreshFolderContent } from "../../API/fileSystemService";
import CatalogItem from "../../Components/CatalogItem/CatalogItem";
import useContextMenu from "../../hooks/useContextMenu";
import CatalogContextMenu from "../../Components/CatalogContextMenu/CatalogContextMenu";
import useOutsideHandle from "../../hooks/useOutsideHandle";
import styles from "./Catalog.module.css";
import { useUpload } from "../../context/UploadContext";
import clsx from "clsx";
import { useState } from "react";
import PathNavigator from "../../Components/PathNavigator/PathNavigator";

const Catalog = () => {
  const NOT_INI = "notIni";

  const { dirId } = useParams();
  const { data, isPending } = useFolderContent(dirId);
  const { isOpen, position, closeMenu, handleContextMenu } = useContextMenu();
  const catalogRef = useOutsideHandle(["click", "contextmenu"], () => closeMenu(), false, false);
  const refreshFolder = useRefreshFolderContent(dirId);
  const [canBeDrop, setCanBeDrop] = useState(NOT_INI);
  const { addUploads } = useUpload();
  const navigator = useNavigate();

  function handleDrop(e) {
    e.preventDefault();

    setCanBeDrop(NOT_INI);
    const dt = e.dataTransfer;
    const files = [];

    for (const item of dt.items) {
      if (checkIsFile(item)) files.push(item.getAsFile());
    }

    if (files.length > 0) {
      addUploads(files, dirId);
      navigator("/upload");
    }
  }

  function handleOver(e) {
    e.preventDefault();
    const dt = e.dataTransfer;

    if (canBeDrop == NOT_INI) {
      const hasNonFileItem = Array.from(dt.items).some(item => item.kind !== "file");

      if (hasNonFileItem) {
        dt.dropEffect = "none";
        setCanBeDrop(false);
      } else {
        setCanBeDrop(true);
      }
    } else if (canBeDrop === false) {
      dt.dropEffect = "none";
    }
  }

  function handleLeave(e) {
    e.preventDefault();
    setCanBeDrop(NOT_INI);
  }

  function checkIsFile(item) {
    if (item.webkitGetAsEntry) {
      return item.webkitGetAsEntry().isFile;
    } else {
      const file = item.getAsFile();
      if (!file.type && file.size % 4096 === 0) return false;
      else return true;
    }
  }

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
        {data.contents.length > 0 &&
          data.contents.map(item => <CatalogItem key={item.id} catalogItem={item} />)}

        {data.contents.length == 0 && <p>{"тут ничего нет"}</p>}
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
