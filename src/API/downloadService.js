import { SERVER_URL } from "./config";

export async function downloadFile(fileId) {
  const url = SERVER_URL + `/download/file?fileId=${fileId}`;
  startDownload(url);
}

export async function downloadDirOrMany(items) {
  const res = await fetch(SERVER_URL + "/download/archive/ini", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({
      items,
    }),
  });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message);
  }

  const taskId = json.taskId;
  await startPolling(taskId);

  startDownload(SERVER_URL + `/download/archive?taskId=${taskId}`);
}

function startPolling(taskId) {
  const interval = 2 * 1000;

  return new Promise(resolve => {
    const intervalId = setInterval(async () => {
      const status = await checkTaskStatus(taskId);

      if (status == "error") {
        clearInterval(intervalId);
        throw new Error("Не удалось создать архив");
      }
      if (status == "ready") {
        resolve();
        clearInterval(intervalId);
      }
    }, interval);
  });
}

async function checkTaskStatus(taskId) {
  const res = await fetch(SERVER_URL + `/download/archive/status?taskId=${taskId}`, {
    credentials: "include",
  });
  const json = await res.json();
  return json.status;
}

function startDownload(href) {
  const a = document.createElement("a");
  a.href = href;
  a.click();
}
