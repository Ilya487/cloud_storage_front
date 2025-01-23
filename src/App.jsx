import { Navigate, Route, Routes } from "react-router";
import Login from "./pages/Login/Login";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import AuthQuard from "./utils/AuthQuard";
import Catalog from "./pages/Catalog/Catalog";

function App() {
  // async function createDir() {
  //   const response = await fetch(SERVER_URL + "/folder", {
  //     credentials: "include",
  //     method: "POST",
  //     body: JSON.stringify({
  //       dirName: dirName,
  //     }),
  //   });
  //   const json = await response.json();
  //   console.log(json);
  // }

  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route element={<AuthQuard />}>
          <Route path="catalog" element={<Navigate to={"/catalog/root"} />} />
          <Route path="catalog/:dirId" element={<Catalog />} />
        </Route>
      </Routes>
      <ReactQueryDevtools></ReactQueryDevtools>
    </QueryClientProvider>
  );
}

export default App;
