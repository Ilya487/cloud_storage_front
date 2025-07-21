import { Navigate, Outlet } from "react-router";
import styles from "./styles.module.css";
import { useGetUser } from "../API/authService";
import Spinner from "../Components/Spinner/Spinner";
import { createPortal } from "react-dom";

const PrivateRoute = () => {
  const { data, isPending } = useGetUser();

  if (isPending) return createPortal(<Spinner className={styles.spinner} />, document.body);
  if (data.auth) return <Outlet />;
  else return <Navigate to={"/login"} replace />;
};

export default PrivateRoute;
