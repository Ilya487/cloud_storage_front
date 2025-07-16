import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SERVER_URL } from "./config";
import useApi from "./useApi";

function getFolderContent(dirId = null) {
  dirId = dirId == "root" ? "" : dirId;

  return {
    url: SERVER_URL + `/folder?dirId=${dirId}`,
    options: {
      credentials: "include",
    },
  };
}

function renameObject({ objectId, newName }) {
  return {
    url: SERVER_URL + "/rename",
    options: {
      method: "PATCH",
      credentials: "include",
      body: JSON.stringify({
        objectId,
        newName,
      }),
    },
  };
}

function createFolder({ name, parentDirId }) {
  parentDirId = parentDirId == "root" ? "" : parentDirId;

  return {
    url: SERVER_URL + "/folder",
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

function deleteObject({ objectId }) {
  return {
    url: SERVER_URL + `/delete?objectId=${objectId}`,
    options: {
      method: "DELETE",
      credentials: "include",
    },
  };
}

function moveObject({ itemId, toDirId }) {
  toDirId = toDirId == "root" ? "" : toDirId;

  return {
    url: SERVER_URL + "/move",
    options: {
      method: "PATCH",
      credentials: "include",
      body: JSON.stringify({
        itemId,
        toDirId,
      }),
    },
  };
}

export async function downloadObject(id) {
  const response = await fetch(SERVER_URL + `/download?fileId=${id}`, { credentials: "include" });

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(errorData.message);
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("Content-Disposition");
  const filename = decodeURI(contentDisposition.match(/filename=(.+)/)[1]);

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function getDirIdByPath(path) {
  return {
    url: SERVER_URL + `/folder/id-by-path?path=${path}`,
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

export const useRefreshFolderContent = dirId => {
  const queryClient = useQueryClient();
  if (!isNaN(dirId)) dirId = Number.parseInt(dirId);

  return () => queryClient.invalidateQueries({ queryKey: ["dir", dirId] });
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
