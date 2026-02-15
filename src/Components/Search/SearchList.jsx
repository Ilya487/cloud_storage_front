import clsx from "clsx";
import styles from "./Search.module.css";
import { forwardRef, useEffect } from "react";
import FolderIcon from "../Icons/FolderIcon";
import FileIcon from "../Icons/FileIcon";

const SearchList = forwardRef(({ items, selectedItemId, onItemClick, onMouseEnter }, ref) => {
  useEffect(() => {
    if (selectedItemId == null) return;
    scrollToSelectedItem(selectedItemId);
  }, [selectedItemId]);

  function scrollToSelectedItem(id) {
    const element = ref.current.querySelector(`[data-id="${id}"]`);
    const offset = 12;
    const container = ref.current;

    const elementTopRelativeToContainer = element.offsetTop;
    const elementBottomRelativeToContainer = element.offsetTop + element.offsetHeight;

    const currentScrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    const isVisible =
      elementTopRelativeToContainer >= currentScrollTop &&
      elementBottomRelativeToContainer <= currentScrollTop + containerHeight;

    if (isVisible) return;

    let newScrollTop = currentScrollTop;

    if (elementTopRelativeToContainer < currentScrollTop) {
      newScrollTop = elementTopRelativeToContainer - offset;
    } else if (elementBottomRelativeToContainer > currentScrollTop + containerHeight) {
      newScrollTop = elementBottomRelativeToContainer - containerHeight + offset;
    }

    container.scrollTo({
      top: newScrollTop,
    });
  }

  return (
    <ul
      tabIndex={-1}
      ref={ref}
      className={
        "absolute z-10 w-full bg-neutral-800 rounded-md p-3 max-h-72 overflow-auto " +
        styles["search-list"]
      }
    >
      {items.map(item => (
        <li
          data-id={item.id}
          key={item.id}
          onClick={() => onItemClick(item)}
          onMouseEnter={onMouseEnter}
          className={clsx(
            "p-3 rounded-md flex items-center hover:bg-neutral-900 cursor-pointer outline-none",
            item.id === selectedItemId && "bg-neutral-900",
          )}
        >
          {item.type == "folder" && <FolderIcon size={25} className={"mr-3"} />}
          {item.type == "file" && <FileIcon size={25} className={"mr-3"} />}
          <div className="w-full">
            <p className="text-sm truncate" title={item.name}>
              {item.name}
            </p>
            <p className="text-sm truncate" title={item.path}>
              {item.path}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
});

export default SearchList;
