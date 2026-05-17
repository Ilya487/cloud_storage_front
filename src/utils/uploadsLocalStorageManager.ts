const storageKey = "uploads";

export interface StoredUploadSession {
  readonly sessionId: number,
  readonly fileInfo: {
    name: string,
    size: number,
    lastModified: number;
  };
}

export const uploadsLocalStorageManager = {
  getUploads(): StoredUploadSession[] {
    const json = localStorage.getItem(storageKey);
    if (json === null) return [];
    const items = JSON.parse(json) ?? [];
    return items;
  },

  clear() {
    localStorage.removeItem(storageKey);
  },

  deleteItem(...sessionIds: number[]) {
    const items = this.getUploads();
    const filterItems = items.filter(upload => !sessionIds.includes(upload.sessionId));

    this.saveItems(filterItems);
  },

  addItem(file: File, sessionId: number) {
    const uploads = this.getUploads();
    if (uploads.some(u => u.sessionId == sessionId)) return;

    const newUpload: StoredUploadSession = {
      sessionId,
      fileInfo: {
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
      }
    };

    uploads.push(newUpload);

    this.saveItems(uploads);
  },

  saveItems(items: StoredUploadSession[]) {
    localStorage.setItem(storageKey, JSON.stringify(items));
  },
};
