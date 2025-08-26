import { useState } from "react";

const useMenuActions = options => {
  const [optionsVisible, setOptionsVisible] = useState(options);

  function handleOptionClick(option, value) {
    setOptionsVisible({ ...optionsVisible, [option]: value });
  }

  function disableActiveOptions() {
    const updatedState = { ...optionsVisible };
    for (const option in updatedState) {
      updatedState[option] = false;
    }

    setOptionsVisible(updatedState);
  }

  return { handleOptionClick, disableActiveOptions, optionsVisible };
};

export default useMenuActions;
