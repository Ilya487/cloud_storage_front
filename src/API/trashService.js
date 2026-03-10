import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SERVER_URL } from "./config";
import useApi from "./useApi";

function getTrashContent() {
  return {
    url: SERVER_URL + `/fs/trash`,
    options: {
      credentials: "include",
    },
  };
}

function restoreItems(itemsIds) {
  return {
    url: SERVER_URL + "/fs/trash/restore",
    options: {
      credentials: "include",
      method: "POST",
      body: JSON.stringify({ items: itemsIds }),
    },
  };
}

function deleteObject({ items }) {
  return {
    url: SERVER_URL + `/fs/delete`,
    options: {
      method: "DELETE",
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
  //   const deleteDirPathCache = useDeleteCacheDirPath();
  const apiFetch = useApi();
  const mutationFn = args => apiFetch(deleteObject(args));

  return useMutation({
    mutationFn,
    onSuccess: (_, { objectId }) => {
      //   deleteDirPathCache(objectId);
      queryClient.removeQueries({ queryKey: ["dir", objectId] });
    },
  });
};

export const useRestoreObjects = () => {
  const queryClient = useQueryClient();
  const apiFetch = useApi();
  const mutationFn = ({ itemsIds }) => apiFetch(restoreItems(itemsIds));

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trash"] }),
  });
};
