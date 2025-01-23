import { useQuery } from "@tanstack/react-query";
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

export const useFolderContent = (dirId = null) => {
  return useQuery({
    queryKey: ["dir", dirId],
    queryFn: () => getFolderContent(dirId),
    refetchOnWindowFocus: false,
  });
};
