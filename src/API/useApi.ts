import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthData } from "./authService";
import apiRequest from "./apiRequest";

const useApi = () => {
  const navigator = useNavigate();
  const queryClient = useQueryClient();

  function onRefreshSuccess(refreshData: AuthData) {
    queryClient.setQueryData(["authUser"], { ...refreshData });
  }

  function onRefreshError() {
    queryClient.setQueryData(["authUser"], { auth: false });
    navigator("/login");
  }

  return apiRequest(onRefreshSuccess, onRefreshError)
};

export default useApi