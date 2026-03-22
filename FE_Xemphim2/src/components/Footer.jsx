import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  Github,
  Send,
  Heart,
  Film,
  Zap
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // Handle newsletter subscription
    const email = e.target.email.value;
    console.log('Newsletter subscription:', email);
    alert('Cảm ơn bạn đã đăng ký!');
    e.target.reset();
  };

  return (
    <footer className="simple-footer">
      {/* MAIN FOOTER */}
      <div className="footer-main-simple">
        <div className="footer-container">
          {/* BRAND & LOGO */}
          <div className="footer-brand">
            <div className="footer-logo-simple">
              <Film size={40} strokeWidth={3} />
              <h3>XEMPHIM</h3>
            </div>
            
          </div>

          {/* NAVIGATION LINKS */}
          <div className="footer-nav-links">
            <Link to="/">Hỏi Đáp |</Link>
            <Link to="/privacy">Chính sách bảo mật |</Link>
            <Link to="/terms">Điều khoản sử dụng |</Link>
            <Link to="/about">Giới thiệu |</Link>
            <Link to="/contact">Liên hệ |</Link>
          </div>

         

          {/* DESCRIPTION */}
          <div className="footer-description">
            <p>
              XEMPHIM – Phim hay có rồi - Trang xem phim online chất lượng cao miễn phí Vietsub, thuyết minh, lồng tiếng full HD. Kho 
              phim mới không lỗ, phim chiếu rạp, phim bộ, phim lẻ từ nhiều quốc gia như Việt Nam, Hàn Quốc, Trung Quốc, Thái Lan, 
              Nhật Bản, Âu Mỹ... đa dạng thể loại. Khám phá nền tảng phim trực tuyến hay nhất 2024 chất lượng 4K!
            </p>
          </div>

          {/* SOCIAL ICONS */}
          <div className="footer-social-simple">                             
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <Facebook size={20} />
            </a>            
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <Youtube size={20} />
            </a>            
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram size={20} />
            </a>
          </div>

          {/* COPYRIGHT */}
          <div className="footer-copyright">
            <p>© {currentYear} XEMPHIM</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
