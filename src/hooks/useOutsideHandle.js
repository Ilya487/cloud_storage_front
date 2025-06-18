import { useEffect, useRef } from "react";

const useOutsideHandle = (events, cb, ignoreFirstEvent = false, includeChildNodes = true) => {
  const ref = useRef();
  const isFirstRender = useRef(true);

  function handleOutside(e) {
    if (!ref.current) return;
    if (ignoreFirstEvent && isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const target = e.target;

    if (target == ref.current || (includeChildNodes && ref.current.contains(target))) return;
    else {
      cb();
    }
  }

  function addEvents() {
    events.forEach(eventName => {
      window.addEventListener(eventName, handleOutside);
    });
  }

  function removeEvents() {
    events.forEach(eventName => {
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
