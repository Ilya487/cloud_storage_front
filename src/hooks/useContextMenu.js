import { useState } from "react";

const useContextMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  function handleContextMenu(e) {
    e.preventDefault();
    const x = e.pageX;
    const y = e.pageY;
    setPosition({ x, y });
    setIsOpen(true);
  }

  function closeMenu() {
    setIsOpen(false);
  }

  return {
    isOpen,
    position,
    closeMenu,
    handleContextMenu,
  };
};

export default useContextMenu;
