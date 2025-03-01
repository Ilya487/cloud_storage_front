import ModalWindow from "../ModalWindow/ModalWindow";
import styles from "./MoveDialog.module.css";
import { useFolderContent, useMoveFolder } from "../../API/fileSystemService";
import { useRef, useState } from "react";
import useOutsideHandle from "../../hooks/useOutsideHandle";
import clsx from "clsx";
import { useNavigate } from "react-router";
import CatalogList from "./CatalogList";
import { ItemCurrentPath, Path } from "./Path";
import BackButton from "./BackButton";
import CancelBtn from "../CancelBtn/CancelBtn";

const MoveDialog = ({ itemId, itemPath, itemName, onClose }) => {
  const modalWindowRef = useOutsideHandle(["click"], handleClose, true);
  const pathMap = useRef([]);
  const [currentDirId, setCurrentDirId] = useState("root");
  const { data, isPending } = useFolderContent(currentDirId);
  const filteredData = (() => {
    if (!data) return;
    const filteredContent = data.contents.filter(object => {
      if (object.type == "file") return false;
      if (object.id == itemId) return false;
      return true;
    });

    return { ...data, contents: filteredContent };
  })();

  const [selectedDirId, setSelectedDirId] = useState();
  const mutation = useMoveFolder();
  const navigate = useNavigate();

  function handleClose() {
    onClose();
  }

  function goInDir(id) {
    pathMap.current.push(currentDirId);
    setCurrentDirId(id);
  }

  function goBack() {
    const prevDirId = pathMap.current.pop();
    setCurrentDirId(prevDirId);
    setSelectedDirId(null);
  }

  function selectDir(id) {
    setSelectedDirId(id);
  }

  function moveItem() {
    if (!selectedDirId) return;
    mutation.mutate(
      { itemId, toDirId: selectedDirId },
      {
        onSuccess: () => {
          handleClose();
          navigate(`/catalog/${selectedDirId}`);
        },
      }
    );
  }

  return (
    <ModalWindow className={styles["modal-window"]} ref={modalWindowRef}>
      <div className={styles["top-block"]}>
        <p className={styles.title}>Перемещение объекта "{itemName}"</p>
        <CancelBtn onClick={handleClose} />
      </div>
      <div className={styles["main-body"]}>
        <BackButton onBack={goBack} canGoBack={pathMap.current.length != 0} />
        <ItemCurrentPath path={itemPath} />
        {isPending && <p style={{ fontSize: "50px" }}>Загрузка...</p>}
        {data && data.contents.length == 0 && (
          <p className={styles["empty-dir"]}>Здесь ничего нет...</p>
        )}
        {data && (
          <CatalogList
            catalog={filteredData.contents}
            onMoveInDir={goInDir}
            onSelect={selectDir}
            selectedDirId={selectedDirId}
            showMoveToRoot={currentDirId == "root" && itemPath.match(/\//g).length > 1}
          />
        )}
        {data && <Path path={data.path} />}
      </div>
      <div className={styles["buttons-block"]}>
        <button
          className={clsx("dialog__btn", styles["ok-btn"])}
          disabled={!selectedDirId || mutation.isPending}
          onClick={moveItem}
        >
          Переместить
        </button>
        <button className="dialog__btn" onClick={handleClose} disabled={mutation.isPending}>
          Отмена
        </button>
      </div>
    </ModalWindow>
  );
};

export default MoveDialog;
