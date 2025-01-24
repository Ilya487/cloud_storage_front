import { useEffect, useRef } from "react";

const useClickOutside = (cb) => {
  const ref = useRef();

  function handleCLick(e) {
    const target = e.target;

    if (target == ref.current || ref.current.contains(target)) return;
    else {
      cb();
    }
  }

  useEffect(() => {
    window.addEventListener("click", handleCLick);

    return () => window.removeEventListener("click", handleCLick);
  }, []);

  return ref;
};

export default useClickOutside;
