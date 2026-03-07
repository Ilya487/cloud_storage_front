import { useState } from "react";

const useSelectMultipleCatalogItems = () => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [visualSelectedItems, setVisualSelectedItems] = useState([]);

  function handleClick(e, catalogItem) {
    const id = catalogItem.id;

    if (visualSelectedItems.includes(id) && e.ctrlKey) {
      const updatedIds = visualSelectedItems.filter(val => val != id);
      const updatedItems = selectedItems.filter(item => item.id != id);
      setVisualSelectedItems(updatedIds);
      setSelectedItems(updatedItems);
      return;
    }

    if (e.ctrlKey) {
      setVisualSelectedItems([...visualSelectedItems, id]);

      if (visualSelectedItems.length == 0) {
        setSelectedItems([catalogItem]);
      } else setSelectedItems([...selectedItems, catalogItem]);

      return;
    }

    setVisualSelectedItems([]);
  }

  function handleContextMenu(catalogItem) {
    if (visualSelectedItems.length > 1 && visualSelectedItems.includes(catalogItem.id)) return;

    setSelectedItems([catalogItem]);
    setVisualSelectedItems([catalogItem.id]);
  }

  function clearSelect() {
    setVisualSelectedItems([]);
  }

  return { selectedItems, visualSelectedItems, handleClick, handleContextMenu, clearSelect };
};

export default useSelectMultipleCatalogItems;
