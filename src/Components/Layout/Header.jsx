import { Link } from "react-router";
import styles from "./Layout.module.css";
import { useGetUser, useLogOut } from "../../API/authService";

const Header = () => {
  const { data, isPending } = useGetUser();
  const logout = useLogOut();

  if (isPending) return <></>;
  return (
    <header className={styles.header} style={{ display: "flex", justifyContent: "space-between" }}>
      <p>Это хедер</p>
      {(!data || data.auth == false) && <Link to={{ pathname: "/login" }}>Вход</Link>}
      {data && data.auth && <button onClick={logout.mutate}>Выход</button>}
    </header>
  );
};

export default Header;
