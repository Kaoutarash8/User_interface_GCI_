import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import NotificationPanel from './NotificationPanel';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <div className="app-root">
      <header className="header">
        <div className="logo">GCI</div>
        <nav className="nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Historique
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Profil
          </NavLink>
          
          <button 
  onClick={toggleNotifications}
  className="nav-link"
  style={{
    background: showNotifications ? 'var(--active-color)' : 'none', // Effet actif
    border: 'none',
    color: 'inherit',
    font: 'inherit',
    cursor: 'pointer',
    padding: '8px 16px',
    textDecoration: 'none',
    borderRadius: '4px'
  }}
>
  Notifications
</button>
          
          <button className="logout-btn" onClick={handleLogout}>
            Déconnexion
          </button>
        </nav>
      </header>

      <motion.main
        className="container"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
      >
        {children}
      </motion.main>

      {/* Overlay notifications */}
      {showNotifications && (
        <NotificationPanel onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
};

export default Layout;