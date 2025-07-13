import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SERVER_URL } from "./config";

async function checkAuth() {
  const response = await fetch(SERVER_URL + "/auth/check-auth", {
    credentials: "include",
  });

  return response.json();
}

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

export const useAuth = () =>
  useQuery({
    queryKey: ["auth"],
    queryFn: checkAuth,
    staleTime: 1000 * 60 * 25,
  });

export const useSignin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signinUser,
    onSuccess: () => queryClient.invalidateQueries(["auth"]),
  });
};

export const useLogOut = () => useMutation({ mutationFn: logOut });

export const useSignUp = () => useMutation({ mutationFn: signupUser });
