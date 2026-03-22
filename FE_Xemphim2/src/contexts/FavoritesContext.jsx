import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userService } from '../api/userService';
import { getAuth } from '../store/auth';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const { user } = getAuth();

  // Cache TTL: 5 phút
  const CACHE_TTL = 5 * 60 * 1000;

  const fetchFavorites = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setFavorites([]);
      return [];
    }

    // Nếu đã fetch trong vòng 5 phút và không force refresh → dùng cache
    if (!forceRefresh && lastFetch && (Date.now() - lastFetch < CACHE_TTL)) {
      return favorites;
    }

    // Nếu đang loading → không fetch nữa
    if (loading) return favorites;

    setLoading(true);
    try {
      const res = await userService.getFavorites(user.id);
      const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setFavorites(list);
      setLastFetch(Date.now());
      return list;
    } catch (err) {
      console.error('Error fetching favorites:', err);
      return favorites;
    } finally {
      setLoading(false);
    }
  }, [user?.id, favorites, lastFetch, loading]);

  const isFavorite = useCallback((movieId) => {
    return favorites.some(f => 
      f.MaPhim === movieId || (f.phim && f.phim.MaPhim === movieId)
    );
  }, [favorites]);

  const addFavorite = useCallback(async (movieId) => {
    if (!user?.id) return false;

    try {
      await userService.addFavorite(user.id, movieId);
      // Optimistic update
      setFavorites(prev => [...prev, { MaPhim: movieId }]);
      setLastFetch(Date.now());
      return true;
    } catch (err) {
      console.error('Error adding favorite:', err);
      // Rollback optimistic update
      await fetchFavorites(true);
      return false;
    }
  }, [user?.id, fetchFavorites]);

  const removeFavorite = useCallback(async (movieId) => {
    if (!user?.id) return false;

    try {
      await userService.removeFavorite(user.id, movieId);
      // Optimistic update
      setFavorites(prev => prev.filter(f => 
        f.MaPhim !== movieId && f.phim?.MaPhim !== movieId
      ));
      setLastFetch(Date.now());
      return true;
    } catch (err) {
      console.error('Error removing favorite:', err);
      // Rollback optimistic update
      await fetchFavorites(true);
      return false;
    }
  }, [user?.id, fetchFavorites]);

  const toggleFavorite = useCallback(async (movieId) => {
    if (isFavorite(movieId)) {
      return await removeFavorite(movieId);
    } else {
      return await addFavorite(movieId);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  // Auto fetch khi user đăng nhập
  useEffect(() => {
    if (user?.id) {
      fetchFavorites();
    } else {
      setFavorites([]);
      setLastFetch(null);
    }
  }, [user?.id]);

  const value = {
    favorites,
    loading,
    fetchFavorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
