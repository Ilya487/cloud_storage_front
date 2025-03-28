import { useUpload } from "../../context/UploadContext";
import styles from "./Layout.module.css";

import { Link, NavLink, Outlet } from "react-router";

const Layout = () => {
  const { countOfActiveUpload } = useUpload();

  return (
    <div className={styles.wrapper}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <p>Это хедер</p>
        <Link to={{ pathname: "/login" }}>Вход</Link>
      </header>
      <aside>
        <Link to={{ pathname: "/catalog" }}>Каталог</Link>
        <Link to={{ pathname: "/upload" }}>Загрузка {countOfActiveUpload}</Link>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
