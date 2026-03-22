import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, loginWithGoogle } from "../store/auth";
import { useGoogleLogin } from '@react-oauth/google';
import ReCAPTCHA from "react-google-recaptcha";
import "./Login.css";

const Login = () => {
  const [isActive, setIsActive] = useState(false);
  const [loginForm, setLoginForm] = useState({ ten_dang_nhap: "", mat_khau: "" });
  const [registerForm, setRegisterForm] = useState({ ten_dang_nhap: "", email: "", mat_khau: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const loginRecaptchaRef = useRef(null);
  const registerRecaptchaRef = useRef(null);

  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
    if (error) setError("");
  };
  
  const handleRegisterChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
    if (error) setError("");
  };
  
  const handleRecaptchaChange = () => {
    if (error && error.includes("reCAPTCHA")) {
      setError("");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const recaptchaToken = loginRecaptchaRef.current?.getValue();
      if (!recaptchaToken) {
        setError("Vui lòng xác thực reCAPTCHA");
        return;
      }
      
      await loginUser({ ...loginForm, recaptcha_token: recaptchaToken });
      navigate("/");
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại!");
      loginRecaptchaRef.current?.reset();
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const recaptchaToken = registerRecaptchaRef.current?.getValue();
      if (!recaptchaToken) {
        setError("Vui lòng xác thực reCAPTCHA");
        return;
      }
      
      await registerUser({ ...registerForm, recaptcha_token: recaptchaToken });
      navigate("/");
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || "Đăng ký thất bại!");
      registerRecaptchaRef.current?.reset();
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await res.json();
        console.log("Google User Info:", userInfo);
        
        await loginWithGoogle({
          email: userInfo.email,
          name: userInfo.name,
          google_id: userInfo.sub,
          avatar: userInfo.picture,
        });
        navigate("/");
        window.location.reload();
      } catch (err) {
        console.error("Google Login Error:", err);
        setError(err.response?.data?.message || "Đăng nhập Google thất bại!");
      }
    },
    onError: (error) => {
      console.error("Google OAuth Error:", error);
      setError("Đăng nhập Google thất bại!");
    },
  });



  return (
    <div className="login-body">
      <div className={`container ${isActive ? "active" : ""}`}>
        
        {/* Form Đăng Nhập */}
        <div className="form-box login">
          <form onSubmit={handleLogin}>
            <h1>Đăng Nhập</h1>
            <div className="input-box">
              <input 
                type="text" 
                name="ten_dang_nhap" 
                placeholder="Tên đăng nhập" 
                required 
                value={loginForm.ten_dang_nhap}
                onChange={handleLoginChange}
              />
              <i className='bx bxs-user'></i>
            </div>
            <div className="input-box">
              <input 
                type="password" 
                name="mat_khau" 
                placeholder="Mật khẩu" 
                required 
                value={loginForm.mat_khau}
                onChange={handleLoginChange}
              />
              <i className='bx bxs-lock-alt'></i>
            </div>
            <div className="forgot-link">
              <a href="#">Quên mật khẩu?</a>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0 10px' }}>
              <ReCAPTCHA
                ref={loginRecaptchaRef}
                sitekey="6LeHexosAAAAAJHPXnYN5_8E8BQB7hmgI5trLkro"
                theme="dark"
                onChange={handleRecaptchaChange}
              />
            </div>
            
            {error && !isActive && <p className="error-text">{error}</p>}
            <button type="submit" className="btn">Đăng Nhập</button>
            <p>hoặc đăng nhập với</p>
            <div className="social-icons">
              <a href="#" onClick={(e) => { e.preventDefault(); handleGoogleLogin(); }}><i className='bx bxl-google'></i></a>
            </div>
          </form>
        </div>

        {/* Form Đăng Ký */}
        <div className="form-box register">
          <form onSubmit={handleRegister}>
            <h1>Đăng Ký</h1>
            <div className="input-box">
              <input 
                type="text" 
                name="ten_dang_nhap" 
                placeholder="Tên đăng nhập" 
                required 
                value={registerForm.ten_dang_nhap}
                onChange={handleRegisterChange}
              />
              <i className='bx bxs-user'></i>
            </div>
            <div className="input-box">
              <input 
                type="email" 
                name="email" 
                placeholder="Email" 
                required 
                value={registerForm.email}
                onChange={handleRegisterChange}
              />
              <i className='bx bxs-envelope'></i>
            </div>
            <div className="input-box">
              <input 
                type="password" 
                name="mat_khau" 
                placeholder="Mật khẩu" 
                required 
                value={registerForm.mat_khau}
                onChange={handleRegisterChange}
              />
              <i className='bx bxs-lock-alt'></i>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0 10px' }}>
              <ReCAPTCHA
                ref={registerRecaptchaRef}
                sitekey="6LeHexosAAAAAJHPXnYN5_8E8BQB7hmgI5trLkro"
                theme="dark"
                onChange={handleRecaptchaChange}
              />
            </div>
            
            {error && isActive && <p className="error-text">{error}</p>}
            <button type="submit" className="btn">Đăng Ký</button>
            <p>hoặc đăng ký với</p>
            <div className="social-icons">
              <a href="#" onClick={(e) => { e.preventDefault(); handleGoogleLogin(); }}><i className='bx bxl-google'></i></a>
            </div>
          </form>
        </div>

        {/* Toggle Box */}
        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1>Chào mừng trở lại!</h1>
            <p>Bạn đã có tài khoản?</p>
            <button className="btn login-btn" onClick={() => setIsActive(false)}>Đăng Nhập</button>
          </div>
          <div className="toggle-panel toggle-right">
            <h1>Xin chào!</h1>
            <p>Bạn chưa có tài khoản?</p>
            <button className="btn register-btn" onClick={() => setIsActive(true)}>Đăng Ký</button>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Login;
