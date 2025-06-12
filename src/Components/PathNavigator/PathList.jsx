import { useNavigate } from "react-router";
import styles from "./PathNavigator.module.css";
import { useDirIdByPath } from "../../API/fileSystemService";
import { HiDotsHorizontal } from "react-icons/hi";
import clsx from "clsx";
import { useEffect, useState } from "react";
import useOutsideHandle from "../../hooks/useOutsideHandle";
import { IoIosArrowForward } from "react-icons/io";

const PathList = ({ pathMap, currentPath }) => {
  const navigator = useNavigate();
  const getIdByPath = useDirIdByPath();
  const [menuVisible, setMenuVisible] = useState(false);
  const menuRef = useOutsideHandle(["click"], () => setMenuVisible(false));

  const [visibleItems, hideItems] = splitItems();

  function splitItems() {
    if (pathMap.length <= 3) {
      return [pathMap, []];
    } else {
      const hideItems = pathMap.slice(0, -2);
      const visibleItems = pathMap.slice(-2);
      return [visibleItems, hideItems];
    }
  }

  useEffect(() => {
    setMenuVisible(false);
  }, [pathMap]);

  async function goToDirByPath(inputPath) {
    if (currentPath == inputPath) return;
    const id = await getIdByPath(inputPath);
    navigator(`/catalog/${id}`);
  }

  function toggleMenu() {
    setMenuVisible(!menuVisible);
  }

  return (
    <div className={styles["path-selector"]}>
      {hideItems.length > 0 && (
        <div className={styles["menu-container"]} ref={menuRef}>
          <HiDotsHorizontal size={23} className={styles["menu-btn"]} onClick={toggleMenu} />
          {menuVisible && (
            <ul className={clsx("context-menu", styles["menu-items"])}>
              {hideItems.map(item => (
                <li
                  className={clsx("context-menu__item", styles["menu-item"])}
                  key={item.path}
                  onClick={() => goToDirByPath(item.path)}
                  title={item.name}
                >
                  {item.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ul className={styles["path-items"]}>
        {visibleItems.map((item, i) => (
          <li key={item.path} className={styles["path-item"]}>
            <span
              className={styles["dir-name"]}
              onClick={() => goToDirByPath(item.path)}
              title={item.name}
            >
              {item.name}
            </span>
            {i + 1 != visibleItems.length && <IoIosArrowForward className={styles.arrow} />}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PathList;
