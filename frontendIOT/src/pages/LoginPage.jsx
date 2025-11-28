import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Animation des nuages
    const clouds = document.querySelectorAll('.login-body .cloud');
    clouds.forEach((cloud, index) => {
      const randomTop = 10 + Math.random() * 80;
      const randomDelay = Math.random() * 20;
      const randomSize = 0.7 + Math.random() * 0.6;
      
      cloud.style.top = `${randomTop}%`;
      cloud.style.animationDelay = `${randomDelay}s`;
      cloud.style.transform = `scale(${randomSize})`;
      cloud.style.opacity = '0.9';
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await login(password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Mot de passe incorrect');
    }
    
    setLoading(false);
  };

  return (
    <div className="login-body">
      <div className="background">
        <div className="cloud"></div>
        <div className="cloud"></div>
        <div className="cloud"></div>
        <div className="cloud"></div>
        <div className="cloud"></div>
        <div className="cloud"></div>
        <div className="cloud"></div>
        <div className="cloud"></div>
        <div className="cloud"></div>
        <div className="cloud"></div>
      </div>
      
      <div className="login-container">
        <div className="logo">
          <h1>GCI</h1>
          <p>Système de Climat Intelligent</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ 
              color: '#ff4444', 
              marginBottom: '1rem', 
              padding: '0.75rem', 
              backgroundColor: '#ffe6e6', 
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Entrez votre mot de passe"
              required
              autoFocus
            />
            
          </div>
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;