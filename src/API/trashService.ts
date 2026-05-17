import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SERVER_URL } from "./config";
import useApi, { type FetchDecoratorParams } from "./useApi";

interface DeleteObjectParams { items: number[] }


function getTrashContent(): FetchDecoratorParams {
  return {
    url: SERVER_URL + `/fs/trash`,
    options: {
      credentials: "include",
    },
  };
}

function restoreItems(itemsIds: number[]): FetchDecoratorParams {
  return {
    url: SERVER_URL + "/fs/trash/restore",
    options: {
      credentials: "include",
      method: "POST",
      body: JSON.stringify({ items: itemsIds }),
    },
  };
}

function deleteObject({ items }: DeleteObjectParams): FetchDecoratorParams {
  return {
    url: SERVER_URL + `/fs/trash/delete`,
    options: {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        items: items,
      }),
    },
  };
}

export const useTrashContent = () => {
  const apiFetch = useApi();

  return useQuery({
    queryKey: ["trash"],
    queryFn: () => apiFetch(getTrashContent()),
    refetchOnWindowFocus: false,
  });
};

export const useDeleteObject = () => {
  const queryClient = useQueryClient();
  const apiFetch = useApi();
  const mutationFn = (args: DeleteObjectParams) => apiFetch(deleteObject(args));

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trash"] }),
  });
};

export const useRestoreObjects = () => {
  const queryClient = useQueryClient();
  const apiFetch = useApi();
  const mutationFn = ({ itemsIds }: { itemsIds: number[] }) => apiFetch(restoreItems(itemsIds));

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trash"] }),
  });
};
