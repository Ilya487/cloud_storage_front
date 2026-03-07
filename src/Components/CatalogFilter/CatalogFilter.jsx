import { useRef } from "react";
import CatalogItemsFilter from "../UI/CatalogItemsFilter";

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
    <div className="grid grid-cols-[4fr_1fr_1fr] p-1.5">
      <CatalogItemsFilter
        text="Название"
        visible={filterSetup.name}
        onClick={() => setFilter("name")}
        ascending={filterSetup.ascending}
      />
      <CatalogItemsFilter
        text="Дата создания"
        visible={filterSetup.date}
        onClick={() => setFilter("date")}
        ascending={filterSetup.ascending}
      />
      <CatalogItemsFilter
        text="Размер файла"
        visible={filterSetup.size}
        onClick={() => setFilter("size")}
        ascending={filterSetup.ascending}
      />
    </div>
  );
};

export default CatalogFilter;
