import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { ThemeProvider } from "./contexts/ThemeContext";
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <GoogleOAuthProvider clientId="880586785536-k07r95jrjed0qld2j847e5ueoqjm06ne.apps.googleusercontent.com">
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </GoogleOAuthProvider>
);
