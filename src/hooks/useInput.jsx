import { useState } from "react";

const useInput = (defaultValue) => {
  const [input, setInput] = useState(defaultValue);

  function handleValue(e) {
    const inputData = e.target.value;
    setInput(inputData);
  }

  return [input, handleValue];
};

export default useInput;
