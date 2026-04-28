import type { AuthData } from "./authService";
import { SERVER_URL } from "./config";

export interface FetchDecoratorParams<TError = DefaultErrorBody> {
    url: RequestInfo,
    options?: RequestInit,
    errorHandler?: ErrorHandler<TError>,
}
interface DefaultErrorBody { message: string, errors?: [] }
type ErrorHandler<T> = (errorData: T, response: Response) => void

let refreshRequest: Promise<AuthData> | null = null;

type RefreshSuccessHandler = (authData: AuthData) => void
type RefreshErrorHandler = () => void

export default function apiRequest(onRefreshSuccess?: RefreshSuccessHandler, onRefreshError?: RefreshErrorHandler) {
    async function fetchDecorator<TData, TError = DefaultErrorBody>({ url, options, errorHandler }: FetchDecoratorParams<TError>): Promise<TData | undefined> {
        const response = await fetch(url, options);
        if (response.ok) {
            if (response.status == 204) return
            return response.json();
        }

        else if (response.status !== 401) {
            const errorData = await response.json();
            if (errorHandler) errorHandler(errorData, response);
            else defaultErrorHandler(errorData, response);
            return
        }

        else if (response.status == 401) {
            if (refreshRequest === null) refreshRequest = refreshToken()
            try {
                const refreshData = await refreshRequest;
                onRefreshSuccess && onRefreshSuccess(refreshData)
                refreshRequest = null
                return fetchDecorator<TData, TError>({ url, options, errorHandler });
            }
            catch (err) {
                refreshRequest = null
                if (err instanceof RefreshTokenError) {
                    onRefreshError && onRefreshError()
                    return
                }
                else if (err instanceof ExtraRefresh) {
                    return fetchDecorator<TData, TError>({ url, options, errorHandler });
                }

                throw err;
            }
        }
    }

    return fetchDecorator;
}

const defaultErrorHandler: ErrorHandler<DefaultErrorBody> = (errorData) => {
    if (errorData.errors) {
        const message = errorData.errors.join("; ");
        throw new Error(message);
    } else throw new Error(errorData.message);
}

async function refreshToken(): Promise<AuthData> {
    const refreshResponse = await fetch(SERVER_URL + "/auth/refresh", {
        method: "POST",
        credentials: "include",
    });

    if (refreshResponse.ok) {
        const data = await refreshResponse.json() as AuthData
        return data;
    }
    else if (refreshResponse.status == 400) throw new ExtraRefresh
    else throw new RefreshTokenError();
}

class RefreshTokenError extends Error { }
class ExtraRefresh extends Error { }
