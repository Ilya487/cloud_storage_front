import { Navigate, Route, Routes } from "react-router";
import Login from "./pages/Login/Login";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Catalog from "./pages/Catalog/Catalog";
import Layout from "./Components/Layout/Layout";
import { UploadProvider } from "./context/UploadContext";
import Upload from "./pages/Upload/Upload";
import { ToastContainer } from "react-toastify";
import PrivateRoute from "./routing/PrivateRoute";
import PublicRoute from "./routing/PublicRoute";

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <UploadProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route element={<PublicRoute />}>
              <Route path="login" element={<Login />} />
            </Route>
            <Route element={<PrivateRoute />}>
              <Route index element={<Navigate to="/catalog" replace />} />
              <Route path="catalog">
                <Route index element={<Navigate to="root" />} />
                <Route path=":dirId" element={<Catalog />} />
              </Route>
              <Route path="/upload" element={<Upload />} />
            </Route>
            <Route path="*" element={<h1>Page not found</h1>} />
          </Route>
        </Routes>
        <ToastContainer />
        <ReactQueryDevtools></ReactQueryDevtools>
      </UploadProvider>
    </QueryClientProvider>
  );
}

export default App;
