import CatalogItemsFilter from "../UI/CatalogItemsFilter";

const CatalogFilter = ({ filterSetup, changeFilter }) => {
  return (
    <div className="grid grid-cols-[4fr_1fr_1fr] p-1.5">
      <CatalogItemsFilter
        text="Название"
        visible={filterSetup.name}
        onClick={() => changeFilter("name")}
        ascending={filterSetup.ascending}
      />
      <CatalogItemsFilter
        text="Дата создания"
        visible={filterSetup.date}
        onClick={() => changeFilter("date")}
        ascending={filterSetup.ascending}
      />
      <CatalogItemsFilter
        text="Размер файла"
        visible={filterSetup.size}
        onClick={() => changeFilter("size")}
        ascending={filterSetup.ascending}
      />
    </div>
  );
};

export default CatalogFilter;
