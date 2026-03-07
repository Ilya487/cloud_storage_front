import clsx from "clsx";
import { FaArrowDown } from "react-icons/fa";

const CatalogItemsFilter = ({ text, onClick, visible, ascending }) => {
  return (
    <div className="flex items-center">
      <div className="flex items-center gap-2 relative z-0 group">
        <button onClick={onClick} className="relative group z-0">
          {text}
        </button>
        <span
          onClick={onClick}
          className="cursor-pointer absolute inset-1/2 w-[125%] h-[125%] -translate-x-1/2 -translate-y-1/2
           rounded-[10px] opacity-0 bg-[#4a494ba8] transition-opacity duration-100 group-hover:opacity-60 -z-1"
        />
        <FaArrowDown
          className={clsx("z-[-1] cursor-pointer", !visible && "hidden", ascending && "rotate-180")}
          onClick={onClick}
        />
      </div>
    </div>
  );
};

export default CatalogItemsFilter;
