import api from "./api";
import publicApi from "./publicApi";

export const fetchMovies = async (page = 1, limit = 20, filters = {}) => {
  try {
    const params = {
      page,
      limit
    };
    
    // Xử lý từng filter
    Object.keys(filters).forEach(key => {
      if (key === 'genres' && Array.isArray(filters.genres) && filters.genres.length > 0) {
        // Laravel nhận genres dạng string phân cách bởi dấu phẩy
        params.genres = filters.genres.join(',');
      } else if (filters[key]) {
        params[key] = filters[key];
      }
    });

    console.log('[movieService] Fetching movies with params:', params);
    
    // Dùng params object thay vì URLSearchParams để axios tự xử lý
    const response = await api.get('/phim', { params });
    
    console.log('[movieService] Full API Response:', response);
    console.log('[movieService] Response.data:', response.data);
    
    return response.data;
  } catch (error) {
    console.error("[movieService] Fetch movies error:", error);
    return { data: [] };
  }
};

export const fetchGenres = async () => {
  try {
    const res = await publicApi.get("/genres");
    return res.data || [];
  } catch (err) {
    console.error("fetchGenres error:", err);
    return [];
  }
};

export const fetchCountries = async () => {
  try {
    const res = await publicApi.get("/countries");
    return res.data || [];
  } catch (err) {
    console.error("fetchCountries error:", err);
    return [];
  }
};

export const getMovie = async (id) => {
  try {
    // Thêm timestamp để bypass cache
    const res = await publicApi.get(`/phim/${id}?_=${Date.now()}`);
    return res.data;
  } catch (err) {
    console.error("getMovie error:", err);
    throw err;
  }
};
export const fetchTopViewed = async () => {
  const response = await api.get("/phim/top/viewed");
  return response.data || [];
};
export const fetchRecommended = async () => {
  const response = await api.get("/phim?sort=newest&limit=10");
  return response.data.data || response.data || [];
};
export const getRatings = async (id) => {
  try {
    const res = await publicApi.get(`/ratings/${id}`);
    return res.data || [];
  } catch (err) {
    console.error("getRatings error:", err);
    return [];
  }
};

export const createMovie = async (movieData) => {
  try {
    let res;
    if (movieData.imageFile || movieData.fileImage) {
      const fd = new FormData();
      const imageFile = movieData.imageFile || movieData.fileImage;

      Object.keys(movieData).forEach((key) => {
        if (key === "imageFile" || key === "fileImage") return;

        if (key === "MaTheLoai" && Array.isArray(movieData[key])) {
          movieData[key].forEach((id) => fd.append("MaTheLoai[]", id));
        } else if (movieData[key] !== null && movieData[key] !== undefined) {
          fd.append(key, movieData[key]);
        }
      });

      fd.append("imageFile", imageFile);
      res = await api.post("/phim", fd);
    } else {
      res = await api.post("/phim", movieData);
    }

    return res.data?.movie || res.data?.data || res.data || {};
  } catch (err) {
    console.error("createMovie error:", err);
    throw err;
  }
};
const createFormData = (data, method = null) => {
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    if (key === 'MaTheLoai' && Array.isArray(data[key])) {
      // Xử lý mảng thể loại
      data[key].forEach(id => formData.append('MaTheLoai[]', id));
    } else if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });

  // Laravel yêu cầu _method='PUT' khi update có file
  if (method) formData.append('_method', method);
  
  return formData;
};
export const createEpisode = async (movieId, episodeData) => {
  try {
    const res = await api.post(`/phim/${movieId}/tap`, episodeData);
    return res.data;
  } catch (err) {
    console.error("createEpisode error:", err);
    throw err;
  }
};
export const updateMovie = async (id, movieData) => {
  // Kiểm tra xem có cần gửi FormData (khi có file ảnh) hay không
  if (movieData.imageFile) {
    const formData = new FormData();
    
    // Append các trường dữ liệu vào FormData
    Object.keys(movieData).forEach(key => {
      if (key === 'MaTheLoai') {
         // Mảng thể loại cần append từng item
         movieData[key].forEach(genreId => formData.append('MaTheLoai[]', genreId));
      } else if (key === 'imageFile') {
         formData.append('imageFile', movieData.imageFile);
      } else if (movieData[key] !== null && movieData[key] !== undefined) {
         formData.append(key, movieData[key]);
      }
    });

    // Laravel yêu cầu _method=PUT khi gửi FormData qua POST
    formData.append('_method', 'PUT'); 

    return api.post(`/phim/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  } else {
    // Gửi JSON bình thường
    return api.put(`/phim/${id}`, movieData);
  }
};

export const incrementView = async (id) => {
  try {
    const res = await publicApi.post(`/phim/${id}/view`);
    return res.data;
  } catch (err) {
    console.error("incrementView error:", err);
    return null;
  }
};
const movieService = {
  fetchMovies,
  fetchTopViewed,
  fetchRecommended,
  fetchGenres,
  fetchCountries,
  getMovie,
  getRatings,
  createMovie,
  createEpisode,
  updateMovie,
  incrementView,
};

export default movieService;
