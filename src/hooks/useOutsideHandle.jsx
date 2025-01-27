import { useEffect, useRef } from "react";

const useOutsideHandle = (events, cb) => {
  const ref = useRef();

  function handleOutside(e) {
    const target = e.target;

    if (target == ref.current || ref.current.contains(target)) return;
    else {
      cb();
    }
  }

  function addEvents() {
    events.forEach((eventName) => {
      window.addEventListener(eventName, handleOutside);
    });
  }

  function removeEvents() {
    events.forEach((eventName) => {
      window.removeEventListener(eventName, handleOutside);
    });
  }

  useEffect(() => {
    addEvents();

    return () => removeEvents();
  }, []);

  return ref;
};

export default useOutsideHandle;
