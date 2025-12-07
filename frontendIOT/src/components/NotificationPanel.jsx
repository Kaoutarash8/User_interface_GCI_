import React, { useState } from 'react';

// Composant NotificationPanel
const NotificationPanel = ({ onClose }) => {
  // Obtenir la date d'aujourd'hui
  const today = new Date();
  const formattedDate = today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const notifications = [
    { 
      id: 1, 
      title: 'Capteur Température Déconnecté',
      message: 'Aucune donnée reçue depuis 15 minutes. Vérifiez la connexion du capteur ou son alimentation.',
      time: 'Il y a 5 min'
    },
    { 
      id: 2, 
      title: 'Variation de Température Rapide',
      message: 'La température a chuté de 4.2°C en 1 heure. Vérifiez les fenêtres ou portes ouvertes.',
      time: 'Il y a 1 heure'
    },
    { 
      id: 3, 
      title: 'Chauffage Actif Depuis Longtemps',
      message: 'Le chauffage fonctionne depuis 7h à niveau 4. Consommation énergétique élevée.',
      time: 'Il y a 2 heures'
    }
  ];

  return (
    <>
      <div 
        className="notification-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          cursor: 'pointer'
        }}
      />
      
      <div
        className="notification-panel"
        style={{
          position: 'fixed',
          top: '70px',
          right: '20px',
          width: '380px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 1001,
          padding: '0',
          maxHeight: '500px',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e0e0e0'
        }}
      >
        {/* En-tête avec date */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e0e0e0',
          background: '#f5f5f5'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#333' }}>
                Notifications
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                {formattedDate}
              </p>
            </div>
            <button 
              onClick={onClose}
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '20px', 
                color: '#666',
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Liste des notifications */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          padding: '8px'
        }}>
          {notifications.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              color: '#666' 
            }}>
              <p style={{ margin: 0, fontSize: '14px' }}>Aucune notification</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  borderRadius: '6px',
                  background: '#f9f9f9',
                  borderLeft: '4px solid #d1adc7',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <h4 style={{ 
                    margin: 0, 
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    {notif.title}
                  </h4>
                  <span style={{ 
                    fontSize: '11px',
                    color: '#888'
                  }}>
                    {notif.time}
                  </span>
                </div>
                
                <p style={{ 
                  margin: '4px 0 0 0', 
                  fontSize: '13px',
                  lineHeight: '1.4',
                  color: '#555'
                }}>
                  {notif.message}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Pied de page */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #e0e0e0',
          background: '#f5f5f5'
        }}>
          <button
            style={{
              width: '100%',
              padding: '8px',
              background: '#d1adc7',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            marque comme lu 
          </button>
        </div>
      </div>
    </>
  );
};

// Composant Layout avec notifications
const LayoutWithNotifications = ({ children }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = 3;

  return (
    <div className="app-root">
      <header className="header">
        <div className="logo">Tableau de Bord Climatique</div>
        <nav className="nav">
          <a href="/dashboard" className="nav-link active">Dashboard</a>
          <a href="/history" className="nav-link">Historique</a>
          <a href="/profile" className="nav-link">Profil</a>
          
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              padding: '8px',
              color: '#666'
            }}
          >
            {/* Icône de notification */}
            <div style={{ position: 'relative' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: '#ff4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600'
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
          </button>
          
          <button className="logout-btn">Déconnexion</button>
        </nav>
      </header>
      
      {showNotifications && (
        <NotificationPanel onClose={() => setShowNotifications(false)} />
      )}
      
      <main className="container">
        {children}
      </main>
    </div>
  );
};

// Exemple d'utilisation
const AppExample = () => {
  return (
    <LayoutWithNotifications>
      <div style={{ padding: '20px' }}>
        <h1>Exemple de Page</h1>
        <p>Cliquez sur l'icône de notification en haut à droite pour voir les alertes.</p>
      </div>
    </LayoutWithNotifications>
  );
};

export default AppExample;