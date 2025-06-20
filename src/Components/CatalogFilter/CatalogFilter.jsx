import { FaArrowDown } from "react-icons/fa";
import styles from "./CatalogFilter.module.css";
import clsx from "clsx";
import { useRef } from "react";

const CatalogFilter = ({ filterSetup, setFilterSetup }) => {
  const activeFilter = useRef();

  function findActiveFilter() {
    for (let filter in filterSetup) {
      if (filterSetup[filter]) {
        return filter;
      }
    }
  }

  if (activeFilter.current === undefined) {
    activeFilter.current = findActiveFilter();
  }

  function setFilter(filterName) {
    const updatedFilter = { ...filterSetup };

    if (filterName == activeFilter.current) {
      updatedFilter.ascending = !updatedFilter.ascending;
    } else {
      updatedFilter[activeFilter.current] = false;
      updatedFilter[filterName] = true;
      activeFilter.current = filterName;
      updatedFilter.ascending = true;
    }

    setFilterSetup(updatedFilter);
  }

  return (
    <li className={styles["catalog-headers"]}>
      <div className={styles["filter-item"]}>
        <button onClick={() => setFilter("name")} className={styles["filter-btn"]}>
          Название
        </button>
        <FaArrowDown
          display={filterSetup.name ? "true" : "none"}
          className={clsx(styles.arrow, filterSetup.ascending && styles["arrow--up"])}
        />
      </div>
      <div className={styles["filter-item"]}>
        <button onClick={() => setFilter("date")} className={styles["filter-btn"]}>
          Дата создания
        </button>{" "}
        <FaArrowDown
          display={filterSetup.date ? "true" : "none"}
          className={clsx(styles.arrow, filterSetup.ascending && styles["arrow--up"])}
        />
      </div>
      <div className={styles["filter-item"]}>
        <button onClick={() => setFilter("size")} className={styles["filter-btn"]}>
          Размер файла
        </button>
        <FaArrowDown
          display={filterSetup.size ? "true" : "none"}
          className={clsx(styles.arrow, filterSetup.ascending && styles["arrow--up"])}
        />
      </div>
    </li>
  );
};

export default CatalogFilter;
