import { useState, useEffect } from "react";
import PathList from "./PathList";

const PathNavigator = ({ path }) => {
  const [pathMap, setPathMap] = useState([]);

  useEffect(() => {
    setPathMap(parsePath(path));
  }, [path]);

  function parsePath(path) {
    if (path == "/") return [{ name: "Мой диск", path }];

    const arr = path.split("/");

    const map = arr.reduce((res, dirName, i) => {
      if (dirName == "") {
        res.push({ name: "Мой диск", path: "/" });
        return res;
      }
      path = arr.slice(0, i + 1).join("/");
      res.push({ name: dirName, path });
      return res;
    }, []);

    return map;
  }

  return <PathList pathMap={pathMap} currentPath={path} />;
};

export default PathNavigator;
