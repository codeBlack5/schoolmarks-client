import client from "./client";

// Authenticated file download. A plain <a href> or window.open() navigation
// never attaches the JWT header, so admin-only export/report endpoints would
// 401. This fetches the file as a blob through the authenticated axios
// instance instead, then triggers the browser's save dialog manually.
export async function downloadFile(url, filename) {
  const res = await client.get(url, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
