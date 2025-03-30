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

async function moveFolder({ itemId, toDirId }) {
  toDirId = toDirId == "root" ? "" : toDirId;

  const response = await fetch(SERVER_URL + "/folder/move", {
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

export const useFolderContent = (dirId = null) => {
  return useQuery({
    queryKey: ["dir", dirId],
    queryFn: () => getFolderContent(dirId),
    refetchOnWindowFocus: false,
  });
};

export const useRenameObject = () => {
  return useMutation({
    mutationFn: renameObject,
  });
};

export const useRefreshFolderContent = dirId => {
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

export const useMoveFolder = () => {
  return useMutation({
    mutationFn: moveFolder,
  });
};
