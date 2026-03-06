import { Link } from "react-router";
import { useUpload } from "../../context/UploadContext";
import { useGetUser } from "../../API/authService";

const Aside = () => {
  const { countOfActiveUpload } = useUpload();
  const { data } = useGetUser();

  if (data && data.auth == true)
    return (
      <aside className="w-52 flex flex-col items-center gap-8 px-1.5 pt-8 bg-amber-800 shrink-0">
        <Link to={{ pathname: "/catalog" }}>Мой диск</Link>
        <Link to={{ pathname: "/upload" }}>Загрузка {countOfActiveUpload}</Link>
        <Link to={{ pathname: "/trash" }}>Корзина</Link>
      </aside>
    );
};

export default Aside;
