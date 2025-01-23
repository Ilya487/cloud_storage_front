import { Navigate, Outlet } from "react-router";
import { useAuth } from "../API/authService";

const AuthQuard = () => {
  const { data, isPending } = useAuth();
  console.log(data);

  if (isPending) return <p>Грузится...</p>;
  if (data.authenticated) return <Outlet />;
  else return <Navigate to={"/login"} replace />;
};

export default AuthQuard;
