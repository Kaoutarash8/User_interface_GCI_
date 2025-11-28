import React, { useState } from 'react';
import Layout from '../components/Layout.jsx';
import { motion } from 'framer-motion';
import { changePassword } from '../services/api';

const ProfilePage = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }

    setLoading(true);
    const result = await changePassword(oldPassword, newPassword);

    if (result.success) {
      setMessage({ type: 'success', text: 'Mot de passe changé avec succès !' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setMessage({ type: 'error', text: result.error || 'Erreur lors du changement de mot de passe' });
    }

    setLoading(false);
  };

  return (
    <Layout>
      <motion.div
        className="profile-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h2>Profil utilisateur</h2>
        
        <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
          {message.text && (
            <div
              style={{
                padding: '1rem',
                marginBottom: '1rem',
                borderRadius: '4px',
                backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
                color: message.type === 'success' ? '#155724' : '#721c24',
                border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
              }}
            >
              {message.text}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="oldPassword">Ancien mot de passe</label>
            <input
              type="password"
              id="oldPassword"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Entrez votre ancien mot de passe"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="newPassword">Nouveau mot de passe</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Entrez votre nouveau mot de passe (min 6 caractères)"
              required
              minLength={6}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmez votre nouveau mot de passe"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? 'Changement en cours...' : 'Changer le mot de passe'}
          </button>
        </form>
      </motion.div>
    </Layout>
  );
};

export default ProfilePage;


