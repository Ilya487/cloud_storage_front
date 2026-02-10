import Aside from "./Aside";
import Header from "./Header";
import styles from "./Layout.module.css";
import { Outlet } from "react-router";

const Layout = () => {
  return (
    <div className={styles.wrapper}>
      <Header />
      <Aside />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
