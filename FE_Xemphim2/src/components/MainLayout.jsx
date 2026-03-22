// trang nay chua header outlet 
// src/components/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header'; // Import Header của bạn
import Footer from './Footer'; // Import Footer
import ScrollToTop from './ScrollToTop'; // Import ScrollToTop
import { getAuth } from '../store/auth'; // Import auth
import { fetchGenres, fetchCountries } from '../api/movieService'; // Import API
import { useState, useEffect } from 'react';

const MainLayout = () => {
  // Vì Header cần genres và countries, chúng ta tải chúng ở đây
  const [genres, setGenres] = useState([]);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    (async () => {
      setGenres(await fetchGenres());
      setCountries(await fetchCountries());
    })();
  }, []);

  return (
    <div className="app-wrapper">
      <ScrollToTop />
      {/* Header sẽ luôn hiển thị */}
      <Header genres={genres} countries={countries} />
      
      {/* Outlet là nơi Home, MovieDetail, WatchMovie... sẽ được render */}
      <main style={{ minHeight: '100vh' }}>
        <Outlet /> 
      </main>
      
      {/* Footer chung */}
      <Footer />
    </div>
  );
};

export default MainLayout;