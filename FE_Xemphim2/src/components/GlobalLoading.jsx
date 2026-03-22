import React from 'react';
import './css/GlobalLoading.css'; // Chúng ta sẽ tạo file css này ở bước 2

const GlobalLoading = () => {
  return (
    <div className="global-loading-overlay">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
};

export default GlobalLoading;