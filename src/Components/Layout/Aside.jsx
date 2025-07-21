import { Link } from "react-router";
import styles from "./Layout.module.css";
import { useUpload } from "../../context/UploadContext";
import { useGetUser } from "../../API/authService";

const Aside = () => {
  const { countOfActiveUpload } = useUpload();
  const { data } = useGetUser();

  if (data && data.auth == true)
    return (
      <aside>
        <Link to={{ pathname: "/catalog" }}>Каталог</Link>
        <Link to={{ pathname: "/upload" }}>Загрузка {countOfActiveUpload}</Link>
      </aside>
    );
};

export default Aside;
