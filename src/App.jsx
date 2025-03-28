import { Navigate, Route, Routes } from "react-router";
import Login from "./pages/Login/Login";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import AuthQuard from "./utils/AuthQuard";
import Catalog from "./pages/Catalog/Catalog";
import Layout from "./Components/Layout/Layout";
import { UploadProvider } from "./context/UploadContext";
import Upload from "./pages/Upload/Upload";
import { ToastContainer } from "react-toastify";

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <UploadProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="login" element={<Login />} />
            <Route element={<AuthQuard />}>
              <Route path="catalog" element={<Navigate to={"/catalog/root"} />} />
              <Route path="catalog/:dirId" element={<Catalog />} />
              <Route path="/upload" element={<Upload />} />
            </Route>
          </Route>
        </Routes>
        <ToastContainer />
        <ReactQueryDevtools></ReactQueryDevtools>
      </UploadProvider>
    </QueryClientProvider>
  );
}

export default App;
