import { useState } from "react";
import { useUpload } from "../context/UploadContext";
import { useNavigate } from "react-router";

const useFileDrop = dirId => {
  const NOT_INI = "notIni";

  const [canBeDrop, setCanBeDrop] = useState(NOT_INI);
  const { addUploads } = useUpload();
  const navigate = useNavigate();

  function handleDrop(e) {
    e.preventDefault();

    setCanBeDrop(NOT_INI);
    const dt = e.dataTransfer;
    const files = [];

    for (const item of dt.items) {
      if (checkIsFile(item)) files.push(item.getAsFile());
    }

    if (files.length > 0) {
      addUploads(files, dirId);
      navigate("/upload");
    }
  }

  function handleOver(e) {
    e.preventDefault();
    const dt = e.dataTransfer;

    if (canBeDrop == NOT_INI) {
      const hasNonFileItem = Array.from(dt.items).some(item => item.kind !== "file");

      if (hasNonFileItem) {
        dt.dropEffect = "none";
        setCanBeDrop(false);
      } else {
        setCanBeDrop(true);
      }
    } else if (canBeDrop === false) {
      dt.dropEffect = "none";
    }
  }

  function handleLeave(e) {
    e.preventDefault();
    setCanBeDrop(NOT_INI);
  }

  function checkIsFile(item) {
    if (item.webkitGetAsEntry) {
      return item.webkitGetAsEntry().isFile;
    } else {
      const file = item.getAsFile();
      if (!file.type && file.size % 4096 === 0) return false;
      else return true;
    }
  }

  return {
    handleDrop,
    handleOver,
    handleLeave,
    canBeDrop,
  };
};

export default useFileDrop;
