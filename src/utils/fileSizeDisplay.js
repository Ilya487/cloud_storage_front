export default function fileSizeDisplay(size) {
  if (size < 1000) {
    return size + " байт";
  }
  size = size / 1024;
  if (size < 1000) {
    return size.toFixed(1) + " КБ";
  }
  size = size / 1024;
  if (size < 1000) {
    return size.toFixed(1) + " МБ";
  }
  size = size / 1024;
  if (size < 1000) {
    return size.toFixed(1) + " ГБ";
  }
}
