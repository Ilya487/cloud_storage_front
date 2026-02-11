import styles from "./Search.module.css";
import FolderIcon from "../Icons/FolderIcon";
import { useSearchFs } from "../../API/fileSystemService";
import Spinner from "../Spinner/Spinner";
import FileIcon from "../Icons/FileIcon";
import { useNavigate } from "react-router";
import { useState } from "react";
import { debounce } from "../../utils/debounce";

const Search = () => {
  const [query, setQuery] = useState("");
  const { data, isError, isLoading } = useSearchFs(query);
  const navigate = useNavigate();

  function goToFile(id) {
    if (id == null) id = "root";
    navigate(`/catalog/${id}`);
  }

  const debouncedSearch = debounce(e => {
    setQuery(e.target.value);
  }, 1000);

  return (
    <>
      <div className="mb-8 relative">
        <input
          onChange={debouncedSearch}
          type="text"
          placeholder="Поиск"
          className="w-1/2  block bg-white text-black p-2 rounded-md outline-none mx-auto"
        />

        <div className="absolute z-10 w-1/2 left-1/4 bg-neutral-800 rounded-md p-3 h-32 flex items-center justify-center">
          {isLoading && <Spinner />}
          {data?.count === 0 && <p>По вашему запросу ничего не найдено</p>}
        </div>

        {data?.count > 0 && (
          <ul
            className={
              "absolute z-10 w-1/2 left-1/4 bg-neutral-800 rounded-md p-3 max-h-72 overflow-auto " +
              styles["search-list"]
            }
          >
            {data.matches.map(item => (
              <li
                key={item.id}
                className="p-3 rounded-md flex items-center hover:bg-neutral-900 cursor-pointer"
                onClick={() => goToFile(item.parent_id)}
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
