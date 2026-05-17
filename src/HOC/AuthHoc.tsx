import type { FC } from "react";
import { useGetUser } from "../API/authService";

interface Props {
  component: FC;
}

const AuthHoc: FC<Props> = ({ component: Component }) => {
  const { data, isPending } = useGetUser();

  if (isPending || !data?.auth) return null;

  return <Component />;
};

export default AuthHoc;
