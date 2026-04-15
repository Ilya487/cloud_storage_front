import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { SERVER_URL } from "./config";

export interface FetchDecoratorParams<TError = DefaultErrorBody> { url: RequestInfo, options?: RequestInit, errorHandler?: ErrorHandler<TError> }
interface DefaultErrorBody { message: string, errors?: [] }
type ErrorHandler<T> = (errorData: T) => void

let inProgress = false;

const useApi = () => {
  const navigator = useNavigate();
  const queryClient = useQueryClient();

  async function fetchDecorator<TError>({ url, options, errorHandler }: FetchDecoratorParams<TError>) {
    const response = await fetch(url, options);
    if (response.ok) return response.json();
    else if (response.status == 401 && inProgress) return;
    else if (response.status == 401 && !inProgress) {
      inProgress = true;
      const refreshResponse = await fetch(SERVER_URL + "/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (refreshResponse.ok) {
        inProgress = false;
        const data = await refreshResponse.json();
        queryClient.setQueryData(["authUser"], { ...data });
        return fetchDecorator({ url, options, errorHandler });
      } else {
        inProgress = false;
        queryClient.setQueryData(["authUser"], { auth: false });
        navigator("/login");
      }
    }

    const errorData = await response.json();

    if (errorHandler) errorHandler(errorData);
    else defaultErrorHandler(errorData);
  }

  return fetchDecorator;
};

const defaultErrorHandler: ErrorHandler<DefaultErrorBody> = (errorData) => {
  if (errorData.errors) {
    const message = errorData.errors.join("; ");
    throw new Error(message);
  } else throw new Error(errorData.message);
}

export default useApi