import { useEffect, useRef, useState } from "react";
import styles from "./ContextMenu.module.css";

const ContextMenu = ({ menuOptions, coords }) => {
  const [menuCoords, setMenuCoords] = useState({ x: 0, y: 0 });
  const [calcCoordComplete, setCalcCoordComplete] = useState(false);
  const menu = useRef();

  function calculateCoord() {
    const result = { ...coords };

    const menuWidth = menu.current.offsetWidth;
    const menuHeight = menu.current.offsetHeight;

    if (coords.x + menuWidth > window.innerWidth) {
      result.x = coords.x - menuWidth;
    }

    if (coords.y + menuHeight > window.innerHeight) {
      result.y = coords.y - menuHeight;
    }

    setMenuCoords(result);
    setCalcCoordComplete(true);
  }

  useEffect(calculateCoord, [coords]);

  return (
    <ul
      className={styles.menu}
      ref={menu}
      style={{
        top: menuCoords.y + "px",
        left: menuCoords.x + "px",
        visibility: calcCoordComplete ? "visible" : "hidden",
      }}
    >
      {menuOptions.map((item, index) => (
        <li key={index} onClick={item.action} className={styles["menu-item"]}>
          {item.label}
        </li>
      ))}
    </ul>
  );
};

export default ContextMenu;
