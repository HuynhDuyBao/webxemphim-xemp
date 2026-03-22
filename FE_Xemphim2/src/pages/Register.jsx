import { useState } from "react";
import axios from "../api/api";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/auth/register", { fullname, username, email, password });
      alert("Đăng ký thành công!");
      navigate("/login");
    } catch {
      alert("Lỗi đăng ký!");
    }
  };

  return (
    <div style={{ ...wrapper }}>
      <form onSubmit={handleRegister} style={form}>
        <h2 style={{ marginBottom: "20px", color: "#e50914" }}>Đăng ký</h2>

        <input style={input} placeholder="Họ tên" onChange={e => setFullname(e.target.value)} />
        <input style={input} placeholder="Tên đăng nhập" onChange={e => setUsername(e.target.value)} />
        <input style={input} placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input style={input} placeholder="Mật khẩu" type="password" onChange={e => setPassword(e.target.value)} />

        <button style={btn} type="submit">Đăng ký</button>

        <p>Đã có tài khoản? <Link to="/login" style={{ color: "#e50914" }}>Đăng nhập</Link></p>
      </form>
    </div>
  );
}

const wrapper = { background: "#000", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: "#fff" };
const form = { width: "350px", background: "rgba(0,0,0,0.75)", padding: "40px", borderRadius: "6px" };
const input = { width: "100%", padding: "12px", margin: "6px 0", background: "#333", border: "none", color: "#fff", borderRadius: "4px" };
const btn = { width: "100%", padding: "12px", background: "#e50914", border: "none", color: "#fff", borderRadius: "4px", marginTop: "10px" };
