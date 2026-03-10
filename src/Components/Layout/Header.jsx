import { Link } from "react-router";
import { useGetUser, useLogOut } from "../../API/authService";

const Header = () => {
  const { data, isPending } = useGetUser();
  const logout = useLogOut();

  if (isPending) return <></>;
  return (
    <header className="w-full p-5 bg-slate-800">
      <div className="flex justify-between container mx-auto">
        <p>Это хедер</p>
        {(!data || data.auth == false) && <Link to={{ pathname: "/login" }}>Вход</Link>}
        {data && data.auth && <button onClick={logout.mutate}>Выход</button>}
      </div>
    </header>
  );
};

export default Header;
