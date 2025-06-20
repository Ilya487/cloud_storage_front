import { useEffect, useState } from "react";

function useFilteredCatalog(catalog, filterSetup) {
  const [filteredCatalog, setFilteredCatalog] = useState();

  useEffect(() => {
    if (!catalog) return;

    if (filterSetup.name) {
      filterByName(filterSetup.ascending);
    }
    if (filterSetup.date) {
      filterByDate(filterSetup.ascending);
    }
    if (filterSetup.size) {
      filterBySize(filterSetup.ascending);
    }
  }, [catalog, filterSetup]);

  function filterByName(ascending) {
    const updatedCatalog = catalog.toSorted((a, b) => {
      let result = 0;

      if (a.type == "folder" && b.type != "folder") return -1;
      if (b.type == "folder" && a.type != "folder") return 1;

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

  function filterByDate(ascending) {
    const updatedCatalog = catalog.toSorted((a, b) => {
      let result = 0;
      if (a.type == "folder" && b.type != "folder") return -1;
      if (b.type == "folder" && a.type != "folder") return 1;

      const aDate = Date.parse(a.created_at);
      const bDate = Date.parse(b.created_at);
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

  return filteredCatalog;
}

export default useFilteredCatalog;
