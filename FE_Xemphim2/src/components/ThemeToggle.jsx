// src/components/ThemeToggle.jsx - BRUTALIST THEME TOGGLE
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      className="theme-toggle-btn" 
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <>
          <Moon size={20} strokeWidth={3} />
          <span>DARK</span>
        </>
      ) : (
        <>
          <Sun size={20} strokeWidth={3} />
          <span>LIGHT</span>
        </>
      )}
    </button>
  );
};

export default ThemeToggle;
