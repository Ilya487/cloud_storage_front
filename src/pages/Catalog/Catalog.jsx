import { useParams } from "react-router";
import {
  useFolderContent,
  useRefreshFolderContent,
} from "../../API/fileSystemService";
import CatalogItem from "../../Components/CatalogItem/CatalogItem";
import useContextMenu from "../../hooks/useContextMenu";
import CatalogContextMenu from "../../Components/CatalogContextMenu/CatalogContextMenu";
import useOutsideHandle from "../../hooks/useOutsideHandle";
import styles from "./Catalog.module.css";

const Catalog = () => {
  const { dirId } = useParams();
  const { data, isPending } = useFolderContent(dirId);
  const { isOpen, position, closeMenu, handleContextMenu } = useContextMenu();
  const catalogRef = useOutsideHandle(
    ["click", "contextmenu"],
    () => closeMenu(),
    false,
    false
  );
  const refreshFolder = useRefreshFolderContent(dirId);

  if (isPending) return <p>Загрузка...</p>;
  else
    return (
      <>
        <section
          onContextMenu={handleContextMenu}
          ref={catalogRef}
          onClick={() => closeMenu()}
          className={styles.catalog}
        >
          {data.contents.length > 0 &&
            data.contents.map((item) => (
              <CatalogItem key={item.id} catalogItem={item} />
            ))}

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
