import api from "./api";

// videoUrl: string (link/hls)
// options: { videoUid?: string, hlsUrl?: string }
export const addEpisode = async (movieId, episodeName, videoUrl, options = {}) => {
  const payload = {
    TenTap: episodeName,
    Link: videoUrl,
  };

  if (options.videoUid) payload.video_uid = options.videoUid;
  if (options.hlsUrl) payload.hls_url = options.hlsUrl;

  return api.post(`/phim/${movieId}/tap`, payload);
};
