import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SERVER_URL } from "./config";
import useApi from "./useApi";

const getAuthUser = () => ({
  url: SERVER_URL + "/auth/user",
  options: {
    credentials: "include",
  },
});

async function signinUser({ login, password }) {
  const response = await fetch(SERVER_URL + "/auth/signin", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ login, password }),
  });

  if (response.ok) return response.json();
  else {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }
}

async function logOut() {
  const response = await fetch(SERVER_URL + "/auth/logout", {
    credentials: "include",
    method: "POST",
  });

  return response.json();
}

async function signupUser({ login, password }) {
  const response = await fetch(SERVER_URL + "/auth/signup", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ login, password }),
  });

  if (response.ok) return response.json();
  else {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }
}

export const useGetUser = () => {
  const apiFetch = useApi();
  const queryFn = () => apiFetch(getAuthUser());

  return useQuery({
    queryKey: ["authUser"],
    queryFn,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export const useSignin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signinUser,
    onSuccess: () => queryClient.invalidateQueries(["auth"]),
  });
};

export const useLogOut = () => useMutation({ mutationFn: logOut });

export const useSignUp = () => useMutation({ mutationFn: signupUser });
