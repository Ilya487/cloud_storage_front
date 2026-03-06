import Aside from "./Aside";
import Header from "./Header";
import { Outlet } from "react-router";

const Layout = () => {
  return (
    <div className="h-full flex flex-col">
      <Header />
      <div className="flex container mx-auto grow">
        <Aside />
        <main className="grow p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
