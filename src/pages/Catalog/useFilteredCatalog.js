import { useEffect, useRef, useState } from "react";

function useFilteredCatalog(
  catalog,
  dirFirst = true,
  defaulFilterField = "name",
  defaultAsc = true,
) {
  const [filterSetup, setFilterSetup] = useState(() => {
    let res = {
      name: false,
      date: false,
      size: false,
      deleteDate: false,
      ascending: Boolean(defaultAsc),
    };

    if (Object.hasOwn(res, defaulFilterField)) {
      res[defaulFilterField] = true;
    } else res.name = true;

    return res;
  });
  const [filteredCatalog, setFilteredCatalog] = useState();

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

  useEffect(() => {
    if (!catalog) return;

    if (filterSetup.name) {
      filterByName(filterSetup.ascending);
    }
    if (filterSetup.date) {
      filterByDate(filterSetup.ascending, "created_at");
    }
    if (filterSetup.deleteDate) {
      filterByDate(filterSetup.ascending, "deleted_at");
    }
    if (filterSetup.size) {
      filterBySize(filterSetup.ascending);
    }
  }, [catalog, filterSetup]);

  function filterByName(ascending) {
    const updatedCatalog = catalog.toSorted((a, b) => {
      let result = 0;

      if (dirFirst) {
        if (a.type == "folder" && b.type != "folder") return -1;
        if (b.type == "folder" && a.type != "folder") return 1;
      }

      if (a.name.toLowerCase() > b.name.toLowerCase()) {
        result = 1;
      }
      if (a.name.toLowerCase() < b.name.toLowerCase()) {
        result = -1;
      }

      if (!ascending) return -result;
      return result;
    });

    setFilteredCatalog(updatedCatalog);
  }

  function filterByDate(ascending, fieldName) {
    const updatedCatalog = catalog.toSorted((a, b) => {
      let result = 0;

      if (dirFirst) {
        if (a.type == "folder" && b.type != "folder") return -1;
        if (b.type == "folder" && a.type != "folder") return 1;
      }

      const aDate = Date.parse(a[fieldName]);
      const bDate = Date.parse(b[fieldName]);
      result = aDate - bDate;

      if (!ascending) return -result;
      return result;
    });

    setFilteredCatalog(updatedCatalog);
  }

  function filterBySize(ascending) {
    const updatedCatalog = catalog.toSorted((a, b) => {
      let result = 0;
      const sizeA = a.size;
      const sizeB = b.size;

      if (sizeA === null && sizeB === null) return 0;
      if (sizeA === null) return 1;
      if (sizeB === null) return -1;

      if (sizeA > sizeB) {
        result = 1;
      }
      if (sizeA < sizeB) {
        result = -1;
      }

      if (!ascending) return -result;
      return result;
    });
    setFilteredCatalog(updatedCatalog);
  }

  function changeFilter(filterName) {
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

  return { filteredCatalog, changeFilter, filterSetup };
}

export default useFilteredCatalog;
