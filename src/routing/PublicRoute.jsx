import { Navigate, Outlet } from "react-router";
import { useGetUser } from "../API/authService";
import styles from "./styles.module.css";
import { createPortal } from "react-dom";
import Spinner from "../Components/Spinner/Spinner";

const PublicRoute = () => {
  const { data, isPending } = useGetUser();

  if (isPending) return createPortal(<Spinner className={styles.spinner} />, document.body);
  if (!data.auth) return <Outlet />;
  else return <Navigate to={"/"} replace />;
};

export default PublicRoute;
