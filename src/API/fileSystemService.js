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

async function renameFolder({ dirId, newName }) {
  const response = await fetch(SERVER_URL + "/folder/rename", {
    method: "PATCH",
    credentials: "include",
    body: JSON.stringify({
      dirId,
      newName,
    }),
  });

  if (response.ok) return response.json();
  else {
    const errorData = await response.json();
    throw new Error(errorData.message);
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
    throw new Error(errorData.message);
  }
}

async function deleteFolder({ dirId }) {
  const response = await fetch(SERVER_URL + `/folder/delete?dirId=${dirId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (response.ok) return response.json();
  else {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }
}

export const useFolderContent = (dirId = null) => {
  return useQuery({
    queryKey: ["dir", dirId],
    queryFn: () => getFolderContent(dirId),
    refetchOnWindowFocus: false,
  });
};

export const useRenameFolder = () => {
  return useMutation({
    mutationFn: renameFolder,
  });
};

export const useRefreshFolderContent = (dirId) => {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: ["dir", dirId] });
};

export const useCreateFolder = () => {
  return useMutation({
    mutationFn: createFolder,
  });
};

export const useDeleteFolder = () => {
  return useMutation({ mutationFn: deleteFolder });
};
