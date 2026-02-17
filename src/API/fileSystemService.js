import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SERVER_URL } from "./config";
import useApi from "./useApi";

function getFolderContent(dirId = null) {
  return {
    url: SERVER_URL + `/fs/folder/${dirId}`,
    options: {
      credentials: "include",
    },
  };
}

function renameObject({ objectId, newName }) {
  return {
    url: SERVER_URL + `/fs/rename/${objectId}`,
    options: {
      method: "PATCH",
      credentials: "include",
      body: JSON.stringify({
        newName,
      }),
    },
  };
}

function createFolder({ name, parentDirId }) {
  parentDirId = parentDirId == "root" ? "" : parentDirId;

  return {
    url: SERVER_URL + "/fs/folder",
    options: {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        dirName: name,
        parentDirId,
      }),
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

function moveObject({ items, toDirId }) {
  return {
    url: SERVER_URL + "/fs/move",
    options: {
      method: "PATCH",
      credentials: "include",
      body: JSON.stringify({
        items,
        toDirId,
      }),
    },
  };
}

function getDirIdByPath(path) {
  return {
    url: SERVER_URL + `/fs/folder/id-by-path?path=${path}`,
    options: {
      credentials: "include",
    },
  };
}

function search(query) {
  return {
    url: SERVER_URL + `/fs/search?query=${query}`,
    options: {
      credentials: "include",
    },
  };
}

export function useDirIdByPath() {
  const queryClient = useQueryClient();
  const apiFetch = useApi();

  const getDirId = async path => {
    const { dirId } = await apiFetch(getDirIdByPath(path));
    return dirId;
  };

  return async path => {
    const data = await queryClient.fetchQuery({
      queryKey: ["idByPath", path],
      queryFn: () => getDirId(path),
      staleTime: Infinity,
      gcTime: Infinity,
    });

    return data;
  };
}

function useCacheDirPath() {
  const queryClient = useQueryClient();

  return (path, id) => {
    queryClient.prefetchQuery({
      queryKey: ["idByPath", path],
      staleTime: Infinity,
      gcTime: Infinity,
      queryFn: () => id,
    });
  };
}

function useDeleteCacheDirPath() {
  const queryClient = useQueryClient();

  return id => {
    const { path } = queryClient.getQueryData(["dir", id]) ?? {};
    if (path) {
      queryClient.removeQueries({
        queryKey: ["idByPath"],
        predicate: query => {
          const keyPath = query.queryKey[1];
          return keyPath.startsWith(path);
        },
      });
    }
  };
}

export const useFolderContent = (dirId = null) => {
  if (!isNaN(dirId)) dirId = Number.parseInt(dirId);
  const cacheDirPath = useCacheDirPath();
  const apiFetch = useApi();

  const queryFn = async () => {
    const data = await apiFetch(getFolderContent(dirId));
    cacheDirPath(data.path, dirId);
    return data;
  };

  return useQuery({
    queryKey: ["dir", dirId],
    queryFn,
    refetchOnWindowFocus: false,
  });
};

export const useRenameObject = () => {
  const deleteDirPathCache = useDeleteCacheDirPath();
  const apiFetch = useApi();
  const mutationFn = args => apiFetch(renameObject(args));

  return useMutation({
    mutationFn,
    onSuccess: (_, { objectId }) => {
      deleteDirPathCache(objectId);
    },
  });
};

export const useCreateFolder = () => {
  const apiFetch = useApi();
  const mutationFn = args => apiFetch(createFolder(args));

  return useMutation({
    mutationFn,
  });
};

export const useDeleteObject = () => {
  const queryClient = useQueryClient();
  const deleteDirPathCache = useDeleteCacheDirPath();
  const apiFetch = useApi();
  const mutationFn = args => apiFetch(deleteObject(args));

  return useMutation({
    mutationFn,
    onSuccess: (_, { objectId }) => {
      deleteDirPathCache(objectId);
      queryClient.removeQueries({ queryKey: ["dir", objectId] });
    },
  });
};

export const useMoveFolder = () => {
  const deleteDirPathCache = useDeleteCacheDirPath();
  const apiFetch = useApi();
  const mutationFn = args => apiFetch(moveObject(args));

  return useMutation({
    mutationFn,
    onSuccess: (_, { itemId }) => {
      deleteDirPathCache(itemId);
    },
  });
};

export const useSearchFs = query => {
  const apiFetch = useApi();
  const queryClient = useQueryClient();

  const queryFn = async ({ signal }) => {
    await queryClient.cancelQueries({ queryKey: ["search"], exact: true }, { silent: true });
    const requestOptions = search(query);
    requestOptions.options.signal = signal;

    const data = await apiFetch(requestOptions);
    return data;
  };

  return useQuery({
    queryKey: ["search", query],
    queryFn,
    refetchOnWindowFocus: false,
    enabled: query.length > 1,
  });
};
