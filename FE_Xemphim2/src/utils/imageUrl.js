export const getImageUrl = (path) => {
  if (!path) return "https://placehold.co/1920x1080/111/333?text=NO+IMAGE";
  if (path.startsWith("http")) return path;
  
  // Nếu path bắt đầu bằng /storage, nối thêm domain backend
  // Bạn có thể thay đổi domain này nếu deploy lên server khác
  const BACKEND_URL = "http://127.0.0.1:8000";
  
  if (path.startsWith("/storage")) {
    return `${BACKEND_URL}${path}`;
  }
  
  return path;
};
