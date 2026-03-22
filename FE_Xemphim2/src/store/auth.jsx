// src/store/auth.js
import axios from "../api/api";

const TOKEN_KEY = "token";
const USER_KEY = "user";

export const saveAuth = (user, token) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getAuth = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  const user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
  return { user, token };
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isAdmin = () => {
  const user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
  return user?.vai_tro === "admin";
};


export const loginUser = async (data) => {
  const res = await axios.post("/auth/login", data);
  if (res.data?.token) saveAuth(res.data.user, res.data.token);
  return res.data;
};

export const registerUser = async (data) => {
  const res = await axios.post("/auth/register", data);
  if (res.data?.token) saveAuth(res.data.user, res.data.token);
  return res.data;
};

export const updateUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};

export const loginWithGoogle = async (credential) => {
  const res = await axios.post("/auth/google", { credential });
  if (res.data?.token) saveAuth(res.data.user, res.data.token);
  return res.data;
};

export const loginWithFacebook = async (credential) => {
  const res = await axios.post("/auth/facebook", { credential });
  if (res.data?.token) saveAuth(res.data.user, res.data.token);
  return res.data;
};
