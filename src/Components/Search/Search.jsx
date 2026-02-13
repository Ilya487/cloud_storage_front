import styles from "./Search.module.css";
import FolderIcon from "../Icons/FolderIcon";
import { useSearchFs } from "../../API/fileSystemService";
import Spinner from "../Spinner/Spinner";
import FileIcon from "../Icons/FileIcon";
import { useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { debounce } from "../../utils/debounce";
import clsx from "clsx";
import { CiSearch } from "react-icons/ci";
import { MdClear } from "react-icons/md";
import useInput from "../../hooks/useInput";
import useOutsideHandle from "../../hooks/useOutsideHandle";

const NOT_SELECTED_ITEM = { id: -1, index: -1 };

const Search = () => {
  const ulRef = useRef();
  const searchRef = useOutsideHandle(["click"], () => {
    setVisibleSearchList(false);
    setSelectedItem(NOT_SELECTED_ITEM);
  });
  const inputRef = useRef();
  const [inputValue, handleInput, setInputValue] = useInput("");
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(NOT_SELECTED_ITEM);
  const [visibleSearchList, setVisibleSearchList] = useState(true);
  const { data, isError, isLoading } = useSearchFs(query);
  const navigate = useNavigate();

  function goToFile(id) {
    if (id == null) id = "root";
    navigate(`/catalog/${id}`);
  }

  const debouncedSearch = useRef(
    debounce(str => {
      setQuery(str);
      setVisibleSearchList(true);
      setSelectedItem(NOT_SELECTED_ITEM);
    }, 300),
  );

  useEffect(() => {
    debouncedSearch.current(inputValue);
  }, [inputValue]);

  function handleItemClick(id) {
    setSelectedItem(NOT_SELECTED_ITEM);
    setVisibleSearchList(false);
    goToFile(id);
  }

  function handleClearBtnClick() {
    setInputValue("");
    setVisibleSearchList(false);
    inputRef.current.focus();
  }

  function handleArrowPress(e) {
    if (!(e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Enter")) return;
    if (!data || data?.count == 0) return;
    if (e.key === "Enter" && selectedItem != NOT_SELECTED_ITEM) {
      goToFile(data.matches[selectedItem.index].parent_id);
      setVisibleSearchList(false);
      setSelectedItem(NOT_SELECTED_ITEM);
      ulRef.current.focus();
      return;
    }
    e.preventDefault();

    let newSelectedItem;
    if (e.key === "ArrowUp") newSelectedItem = handleUp();
    else newSelectedItem = handleDown();

    setSelectedItem(newSelectedItem);

    scrollToSelectedItem(newSelectedItem.id);
  }

  function handleUp() {
    const newSelectedItem = { ...NOT_SELECTED_ITEM };

    if (selectedItem == NOT_SELECTED_ITEM) {
      newSelectedItem.id = data.matches[data.count - 1].id;
      newSelectedItem.index = data.count - 1;
    } else if (selectedItem.index == 0) {
      const updateIndex = data.count - 1;
      newSelectedItem.id = data.matches[updateIndex].id;
      newSelectedItem.index = updateIndex;
    } else {
      const updateIndex = selectedItem.index - 1;
      newSelectedItem.id = data.matches[updateIndex].id;
      newSelectedItem.index = updateIndex;
    }

    return newSelectedItem;
  }

  function handleDown() {
    const newSelectedItem = { ...NOT_SELECTED_ITEM };

    if (selectedItem == NOT_SELECTED_ITEM) {
      newSelectedItem.id = data.matches[0].id;
      newSelectedItem.index = 0;
    }

    if (data.count === selectedItem.index + 1) {
      newSelectedItem.index = 0;
      newSelectedItem.id = data.matches[0].id;
    } else {
      newSelectedItem.id = data.matches[selectedItem.index + 1].id;
      newSelectedItem.index = selectedItem.index + 1;
    }

    return newSelectedItem;
  }

  function scrollToSelectedItem(id) {
    const element = ulRef.current.querySelector(`[data-id="${id}"]`);
    const offset = 12;
    const container = ulRef.current;

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
    <>
      <div className="w-1/2 mx-auto mb-8 relative" ref={searchRef}>
        <div className="flex items-center bg-white rounded-md px-2">
          <CiSearch size={25} color="black" className="shrink-0" />
          <input
            ref={inputRef}
            onKeyDown={handleArrowPress}
            onFocus={() => setVisibleSearchList(true)}
            value={inputValue}
            onChange={handleInput}
            type="text"
            placeholder="Поиск"
            className="w-full bg-white text-black p-2 outline-none"
          />
          {inputValue.length > 0 && (
            <MdClear
              size={25}
              color="black"
              className="shrink-0 cursor-pointer"
              onClick={handleClearBtnClick}
            />
          )}
        </div>
        {visibleSearchList && (isLoading || data?.count === 0 || isError) && (
          <div className="absolute z-10 w-full bg-neutral-800 rounded-md p-3 h-32 flex items-center justify-center">
            {isLoading && <Spinner />}
            {data?.count === 0 && <p>По вашему запросу ничего не найдено</p>}
            {isError && <p>Произошла непредвиденная ошибка</p>}
          </div>
        )}

        {data?.count > 0 && visibleSearchList && (
          <ul
            tabIndex={-1}
            ref={ulRef}
            className={
              "absolute z-10 w-full bg-neutral-800 rounded-md p-3 max-h-72 overflow-auto " +
              styles["search-list"]
            }
          >
            {data.matches.map(item => (
              <li
                data-id={item.id}
                key={item.id}
                onKeyDown={e => e.preventDefault()}
                onClick={() => handleItemClick(item.parent_id)}
                onMouseEnter={() => setSelectedItem(NOT_SELECTED_ITEM)}
                className={clsx(
                  "p-3 rounded-md flex items-center hover:bg-neutral-900 cursor-pointer outline-non",
                  item.id === selectedItem.id && "bg-neutral-900",
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
        )}
      </div>
    </>
  );
};

export default Search;
