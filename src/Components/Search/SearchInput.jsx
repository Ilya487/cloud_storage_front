import { forwardRef } from "react";
import { CiSearch } from "react-icons/ci";
import { MdClear } from "react-icons/md";

const SearchInput = forwardRef(({ onClearBtnClick, value, onChange, onKeyDown, onFocus }, ref) => {
  return (
    <div className="flex items-center bg-white rounded-md px-2">
      <CiSearch size={25} color="black" className="shrink-0" />
      <input
        ref={ref}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        value={value}
        onChange={onChange}
        type="text"
        placeholder="Поиск"
        className="w-full bg-white text-black p-2 outline-none"
      />
      {value.length > 0 && (
        <MdClear
          size={25}
          color="black"
          className="shrink-0 cursor-pointer"
          onClick={onClearBtnClick}
        />
      )}
    </div>
  );
});

export default SearchInput;
