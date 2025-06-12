import { useEffect, useRef, useState } from "react";
import styles from "./ContextMenu.module.css";
import clsx from "clsx";

const ContextMenu = ({ coords, children, ...args }) => {
  const [menuCoords, setMenuCoords] = useState({ x: 0, y: 0 });
  const [calcCoordComplete, setCalcCoordComplete] = useState(false);
  const menu = useRef();

  function calculateCoord() {
    const result = { ...coords };

    const menuWidth = menu.current.offsetWidth;
    const menuHeight = menu.current.offsetHeight;

    if (result.x + menuWidth > window.innerWidth) {
      result.x = result.x - menuWidth;
    }

    if (result.y + menuHeight > window.innerHeight) {
      result.y = result.y - menuHeight;
    }

    setMenuCoords(result);
    setCalcCoordComplete(true);
  }

  useEffect(calculateCoord, [coords]);

  return (
    <ul
      className={clsx("context-menu", styles.menu, args.className)}
      ref={menu}
      style={{
        top: menuCoords.y + "px",
        left: menuCoords.x + "px",
        visibility: calcCoordComplete ? "visible" : "hidden",
      }}
    >
      {children}
    </ul>
  );
};

export default ContextMenu;
