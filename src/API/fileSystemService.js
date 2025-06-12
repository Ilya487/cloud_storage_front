import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SERVER_URL } from "./config";

async function getFolderContent(dirId = null) {
  dirId = dirId == "root" ? "" : dirId;

  const response = await fetch(SERVER_URL + `/folder?dirId=${dirId}`, {
    credentials: "include",
  });

  if (response.ok) return response.json();
  else {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }
}

async function renameObject({ objectId, newName }) {
  const response = await fetch(SERVER_URL + "/rename", {
    method: "PATCH",
    credentials: "include",
    body: JSON.stringify({
      objectId,
      newName,
    }),
  });

  if (response.ok) return response.json();
  else {
    const errorData = await response.json();
    if (errorData.errors) {
      const message = errorData.errors.join("; ");
      throw new Error(message);
    } else throw new Error(errorData.message);
  }
}

async function createFolder({ name, parentDirId }) {
  parentDirId = parentDirId == "root" ? "" : parentDirId;

  const response = await fetch(SERVER_URL + "/folder", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({
      dirName: name,
      parentDirId,
    }),
  });

  if (response.ok) return response.json();
  else {
    const errorData = await response.json();
    if (errorData.errors) {
      const message = errorData.errors.join("; ");
      throw new Error(message);
    } else throw new Error(errorData.message);
  }
}

async function deleteObject({ objectId }) {
  const response = await fetch(SERVER_URL + `/delete?objectId=${objectId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (response.ok) return response.json();
  else {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }
}

async function moveObject({ itemId, toDirId }) {
  toDirId = toDirId == "root" ? "" : toDirId;

  const response = await fetch(SERVER_URL + "/move", {
    method: "PATCH",
    credentials: "include",
    body: JSON.stringify({
      itemId,
      toDirId,
    }),
  });

  if (response.ok) return response.json();
  else {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }
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

async function getDirIdByPath(path) {
  const response = await fetch(SERVER_URL + `/folder/id-by-path?path=${path}`, {
    credentials: "include",
  });

  if (response.ok) {
    const data = await response.json();
    return data.dirId;
  } else {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }
}

export function useDirIdByPath() {
  const queryClient = useQueryClient();

  return async path => {
    const data = await queryClient.fetchQuery({
      queryKey: ["idByPath", path],
      queryFn: () => getDirIdByPath(path),
      staleTime: Infinity,
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

  return useQuery({
    queryKey: ["dir", dirId],
    queryFn: async () => {
      const data = await getFolderContent(dirId);
      cacheDirPath(data.path, dirId);
      return data;
    },
    refetchOnWindowFocus: false,
  });
};

export const useRenameObject = () => {
  const deleteDirPathCache = useDeleteCacheDirPath();

  return useMutation({
    mutationFn: renameObject,
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
  return useMutation({
    mutationFn: createFolder,
  });
};

export const useDeleteObject = () => {
  const queryClient = useQueryClient();
  const deleteDirPathCache = useDeleteCacheDirPath();

  return useMutation({
    mutationFn: deleteObject,
    onSuccess: (_, { objectId }) => {
      deleteDirPathCache(objectId);
      queryClient.removeQueries({ queryKey: ["dir", objectId] });
    },
  });
};

export const useMoveFolder = () => {
  const deleteDirPathCache = useDeleteCacheDirPath();

  return useMutation({
    mutationFn: moveObject,
    onSuccess: (_, { itemId }) => {
      deleteDirPathCache(itemId);
    },
  });
};
