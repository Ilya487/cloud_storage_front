import styles from "./MoveDialog.module.css";

const ItemCurrentPath = ({ path }) => {
  return (
    <p className={styles.path} title={path}>
      Текущее местоположение: {path}
    </p>
  );
};

const Path = ({ path }) => {
  if (path === "/")
    return (
      <p className={styles.path} title="Мой диск">
        Мой диск
      </p>
    );
  else
    return (
      <p className={styles.path} title={path}>
        {path}
      </p>
    );
};

export { ItemCurrentPath, Path };
