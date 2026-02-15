import { useSearchFs } from "../../API/fileSystemService";
import Spinner from "../Spinner/Spinner";
import { useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { debounce } from "../../utils/debounce";
import useInput from "../../hooks/useInput";
import useOutsideHandle from "../../hooks/useOutsideHandle";
import SearchInput from "./SearchInput";
import SearchList from "./SearchList";

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

  function handleItemClick(item) {
    setSelectedItem(NOT_SELECTED_ITEM);
    setVisibleSearchList(false);
    goToFile(item.parent_id);
  }

  function handleClearBtnClick() {
    setSelectedItem(NOT_SELECTED_ITEM);
    setInputValue("");
    setVisibleSearchList(false);
    inputRef.current.focus();
  }

  function handleInputBtns(e) {
    handleArrowPress(e);
    handleEnter(e);
    handleEscp(e);
    handleSpace(e);
  }

  function handleEnter(e) {
    if (e.key === "Enter" && selectedItem != NOT_SELECTED_ITEM) {
      goToFile(data.matches[selectedItem.index].parent_id);
      setVisibleSearchList(false);
      setSelectedItem(NOT_SELECTED_ITEM);
      ulRef.current.focus();
      return;
    }
  }

  function handleEscp(e) {
    if (e.key !== "Escape") return;
    setSelectedItem(NOT_SELECTED_ITEM);
    setVisibleSearchList(false);
  }

  function handleSpace(e) {
    if (!(e.keyCode == 32 && e.ctrlKey)) return;
    setVisibleSearchList(true);
  }

  function handleArrowPress(e) {
    if (!data || data?.count == 0) return;
    if (!(e.key === "ArrowUp" || e.key === "ArrowDown")) return;
    e.preventDefault();

    let newSelectedItem;
    if (e.key === "ArrowUp") newSelectedItem = handleUp();
    else newSelectedItem = handleDown();

    setSelectedItem(newSelectedItem);
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

  return (
    <>
      <div className="w-1/2 mx-auto mb-8 relative" ref={searchRef}>
        <SearchInput
          ref={inputRef}
          onClearBtnClick={handleClearBtnClick}
          onKeyDown={handleInputBtns}
          onFocus={() => setVisibleSearchList(true)}
          value={inputValue}
          onChange={handleInput}
        />
        {visibleSearchList && (isLoading || data?.count === 0 || isError) && (
          <div className="absolute z-10 w-full bg-neutral-800 rounded-md p-3 h-32 flex items-center justify-center">
            {isLoading && <Spinner />}
            {data?.count === 0 && <p>По вашему запросу ничего не найдено</p>}
            {isError && <p>Произошла непредвиденная ошибка</p>}
          </div>
        )}

        {data?.count > 0 && visibleSearchList && (
          <SearchList
            ref={ulRef}
            items={data.matches}
            selectedItemId={selectedItem != NOT_SELECTED_ITEM ? selectedItem.id : null}
            onItemClick={handleItemClick}
            onMouseEnter={() => setSelectedItem(NOT_SELECTED_ITEM)}
          />
        )}
      </div>
    </>
  );
};

export default Search;
