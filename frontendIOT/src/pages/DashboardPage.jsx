import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getDashboard, setMode as setModeAPI, setComfortTemp, setManualControl, login } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DashboardPage = () => {
  const [targetTemp, setTargetTemp] = useState(null);
  const [currentTemp, setCurrentTemp] = useState(null);
  const [heaterLevel, setHeaterLevel] = useState(0);
  const [fanLevel, setFanLevel] = useState(0);
  const [heaterOn, setHeaterOn] = useState(false);
  const [fanOn, setFanOn] = useState(false);
  const [mode, setMode] = useState('AUTO');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [comfortTemp, setComfortTemp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [temperature24h, setTemperature24h] = useState([]);
  const [prediction24h, setPrediction24h] = useState([]);
  const [hourFilter, setHourFilter] = useState('all');
  
  // États pour contrôler l'affichage des sections
  const [showGraphs, setShowGraphs] = useState(false);
  const [showPredictionsTable, setShowPredictionsTable] = useState(false);

  // Charger les données du dashboard
  const loadDashboard = async () => {
    setLoading(true);
    const result = await getDashboard();
    
    if (result.success && result.data) {
      const data = result.data;
      
      // Températures
      setCurrentTemp(data.current_temperature || null);
      
      // État des équipements
      setHeaterOn(data.heater_status === 'ON');
      setFanOn(data.fan_status === 'ON');
      setHeaterLevel(data.heater_level || 0);
      setFanLevel(data.fan_level || 0);
      
      // Mode et configuration
      setMode(data.current_mode || 'AUTO');
      setComfortTemp(data.comfort_temperature || null);
      setTargetTemp(data.comfort_temperature || null);
      
      // Dernière mise à jour
      if (data.last_update) {
        const date = new Date(data.last_update);
        setLastUpdate(
          `${date.getHours().toString().padStart(2, '0')}:${date
            .getMinutes()
            .toString()
            .padStart(2, '0')}`
        );
      }
      
      // Données des 24 dernières heures (températures réelles)
      if (data.temperature_24h && data.temperature_24h.length > 0) {
        setTemperature24h(data.temperature_24h);
      }
      
      // Prédictions des 24 prochaines heures
      if (data.prediction_24h) {
        // Filtrer les prédictions invalides
        const validPredictions = data.prediction_24h.filter(pred => 
          pred && pred.predicted_temp !== null && pred.predicted_temp !== undefined
        );
        setPrediction24h(validPredictions);
      }
    }
    
    setLoading(false);
  };

  useEffect(() => {
    // Auto-login au chargement du dashboard
    const autoLogin = async () => {
      const result = await login("admin123");
      if (result.success) {
        console.log("Connecté automatiquement");
        loadDashboard();
      }
    };
    
    autoLogin();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filtrer les prédictions selon la plage horaire sélectionnée
  const filteredPredictions = React.useMemo(() => {
    if (hourFilter === 'all') {
      return prediction24h;
    }

    const now = new Date();
    const currentHour = now.getHours();
    
    switch (hourFilter) {
      case 'current':
        // De l'heure actuelle à 24h après
        return prediction24h.filter(pred => {
          const predHour = new Date(pred.timestamp).getHours();
          return predHour >= currentHour;
        });
      
      case 'morning':
        // 6h à 12h
        return prediction24h.filter(pred => {
          const predHour = new Date(pred.timestamp).getHours();
          return predHour >= 6 && predHour < 12;
        });
      
      case 'afternoon':
        // 12h à 18h
        return prediction24h.filter(pred => {
          const predHour = new Date(pred.timestamp).getHours();
          return predHour >= 12 && predHour < 18;
        });
      
      case 'evening':
        // 18h à 24h
        return prediction24h.filter(pred => {
          const predHour = new Date(pred.timestamp).getHours();
          return predHour >= 18 && predHour < 24;
        });
      
      case 'night':
        // 0h à 6h
        return prediction24h.filter(pred => {
          const predHour = new Date(pred.timestamp).getHours();
          return predHour < 6;
        });
      
      default:
        return prediction24h;
    }
  }, [prediction24h, hourFilter]);

  // Calculer les statistiques 24h
  const stats24h = React.useMemo(() => {
    if (temperature24h.length === 0) {
      return {
        maxTemp: null,
        minTemp: null,
        avgTemp: null,
        heaterHours: 0,
        fanHours: 0
      };
    }

    const temps = temperature24h.map(item => item.temperature);
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);
    const avgTemp = temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
    const heaterHours = temperature24h.filter(item => item.heater_level > 0).length;
    const fanHours = temperature24h.filter(item => item.fan_level > 0).length;

    return {
      maxTemp,
      minTemp,
      avgTemp,
      heaterHours,
      fanHours
    };
  }, [temperature24h]);

  const adjustTemp = (delta) => {
    setTargetTemp((prev) => {
      const base = prev !== null ? prev : (comfortTemp !== null ? comfortTemp : 21.0);
      const next = Math.round((base + delta) * 2) / 2;
      return Math.max(16, Math.min(30, next));
    });
  };

  const saveComfortTemp = async () => {
    if (targetTemp !== null) {
      try {
        // Validation côté client
        if (targetTemp < 16 || targetTemp > 30) {
          alert('La température de confort doit être entre 16°C et 30°C');
          return;
        }

        const result = await setComfortTemp(targetTemp);
        
        if (result && result.success) {
          setComfortTemp(targetTemp);
          alert(result.message);
          loadDashboard();
        } else {
          alert('Erreur lors de la sauvegarde: ' + (result?.message || 'Erreur inconnue'));
        }
      } catch (error) {
        alert('Erreur lors de la sauvegarde: ' + (error.message || 'Erreur réseau'));
      }
    }
  };

  const handleModeChange = async (newMode) => {
    const modeValue = newMode === 'AUTO' ? 1 : 0;
    const result = await setModeAPI(modeValue);
    if (result.success) {
      setMode(newMode);
      const now = new Date();
      setLastUpdate(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      );
      
      if (newMode === 'AUTO') {
        setHeaterOn(false);
        setFanOn(false);
        setHeaterLevel(0);
        setFanLevel(0);
      }
    } else {
      alert('Erreur lors du changement de mode: ' + result.error);
    }
  };

  const saveManualControls = async () => {
    if (mode === 'MANUEL') {
      try {
        const result = await setManualControl({
          heater_on: heaterOn,
          fan_on: fanOn,
          heater_level: heaterLevel,
          fan_level: fanLevel
        });
        if (result && result.success) {
          alert('Contrôles manuels sauvegardés');
          loadDashboard();
        } else {
          alert('Erreur lors de la sauvegarde: ' + (result?.error || 'Erreur inconnue'));
        }
      } catch (error) {
        alert('Erreur lors de la sauvegarde: ' + error.message);
      }
    }
  };

  // Préparer les données pour les graphiques
  const realChartLabels = temperature24h.length > 0
    ? temperature24h.map((item) => {
        const date = new Date(item.timestamp);
        return `${date.getHours().toString().padStart(2, '0')}:00`;
      })
    : [];

  const realChartData = {
    labels: realChartLabels,
    datasets: [
      {
        label: 'Température Réelle',
        data: temperature24h.map((item) => item.temperature),
        borderColor: 'rgba(209, 173, 199, 1)',
        backgroundColor: 'rgba(209, 173, 199, 0.3)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const predictionVsRealLabels = [];
  const realTemps = [];
  const adjustedTemps = [];

  if (prediction24h.length > 0 && temperature24h.length > 0) {
    const realDataToUse = temperature24h;
    const predDataToUse = prediction24h;
    
    const minLength = Math.min(realDataToUse.length, predDataToUse.length, 24);
    
    for (let i = 0; i < minLength; i++) {
      const realItem = realDataToUse[i];
      const predItem = predDataToUse[i];
      
      const realDate = new Date(realItem.timestamp);
      const hourLabel = `${realDate.getHours().toString().padStart(2, '0')}:00`;
      
      predictionVsRealLabels.push(hourLabel);
      realTemps.push(realItem.temperature);
      adjustedTemps.push(predItem.adjusted_temp);
    }
  }

  const predictionVsRealChartData = {
    labels: predictionVsRealLabels,
    datasets: [
      {
        label: 'Température Réelle',
        data: realTemps,
        borderColor: 'rgba(209, 173, 199, 1)',
        backgroundColor: 'rgba(209, 173, 199, 0.3)',
        tension: 0.4,
        fill: false,
        pointBackgroundColor: 'rgba(209, 173, 199, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      },
      {
        label: 'Température Ajustée',
        data: adjustedTemps,
        borderColor: 'rgba(102, 126, 234, 1)',
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        tension: 0.4,
        fill: false,
        borderDash: [5, 5],
        pointBackgroundColor: 'rgba(102, 126, 234, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1) || 'N/A'}°C`
        }
      },
      title: {
        display: false
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value) => `${value}°C`
        }
      }
    }
  };

  return (
    <Layout>
      {/* En-tête du tableau de bord */}
      <motion.div
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="header-content">
          <h1>Tableau de Bord Climatique</h1>
          <div className="header-info">
            <div className="info-item">
              <span className="info-label">Mode Actuel:</span>
              <span className={`info-value ${mode === 'AUTO' ? 'mode-auto' : 'mode-manuel'}`}>
                {mode}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Dernière mise à jour:</span>
              <span className="info-value">{lastUpdate || 'N/A'}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grille des statistiques en temps réel */}
      <div className="dashboard-grid">
        <motion.div
          className="card stat-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="card-header">
            <div className="card-title">Température Actuelle</div>
          </div>
          <div className="data-value pulse">
            {loading ? '...' : currentTemp !== null ? `${currentTemp.toFixed(1)}°C` : 'N/A'}
          </div>
          <div className="data-label">Intérieure</div>
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="card-header">
            <div className="card-title">Chauffage</div>
          </div>
          <div className={`data-value ${heaterOn ? 'status-on' : 'status-off'}`}>
            {heaterOn ? 'ON' : 'OFF'}
          </div>
          <div className="data-label">
            Niveau: <span>{heaterLevel}</span>/5
          </div>
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="card-header">
            <div className="card-title">Ventilateur</div>
          </div>
          <div className={`data-value ${fanOn ? 'status-on' : 'status-off'}`}>
            {fanOn ? 'ON' : 'OFF'}
          </div>
          <div className="data-label">
            Niveau: <span>{fanLevel}</span>/5
          </div>
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="card-header">
            <div className="card-title">Prédiction Prochaine Heure</div>
          </div>
          <div className="data-value">
            {loading ? '...' : prediction24h.length > 0 ? `${prediction24h[0]?.predicted_temp?.toFixed(1)}°C` : 'N/A'}
          </div>
          <div className="data-label">
            Chauffage: Niv. {prediction24h.length > 0 ? prediction24h[0]?.heater_level || 0 : 0}
          </div>
        </motion.div>
      </div>

      {/* Statistiques 24 heures */}
      <motion.div
        className="stats-24h"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h3>Statistiques des 24 dernières heures</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">
              {loading ? '...' : stats24h.maxTemp !== null ? `${stats24h.maxTemp.toFixed(1)}°C` : 'N/A'}
            </div>
            <div className="stat-label">Température Maximum</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              {loading ? '...' : stats24h.minTemp !== null ? `${stats24h.minTemp.toFixed(1)}°C` : 'N/A'}
            </div>
            <div className="stat-label">Température Minimum</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              {loading ? '...' : stats24h.avgTemp !== null ? `${stats24h.avgTemp.toFixed(1)}°C` : 'N/A'}
            </div>
            <div className="stat-label">Température Moyenne</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{stats24h.heaterHours}h</div>
            <div className="stat-label">Chauffage Actif</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{stats24h.fanHours}h</div>
            <div className="stat-label">Ventilateur Actif</div>
          </div>
        </div>
      </motion.div>

      {/* Contrôle de la température de confort */}
      <motion.div
        className="temp-control"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h3>Température de confort cible</h3>
        <div className="temp-target">
          <div className="temp-display">
            {targetTemp !== null ? `${targetTemp.toFixed(1)}°C` : 'N/A'}
          </div>
          <div className="temp-buttons">
            <button className="temp-btn" onClick={() => adjustTemp(-0.5)}>
              -
            </button>
            <button className="temp-btn" onClick={() => adjustTemp(0.5)}>
              +
            </button>
          </div>
          <button 
            className="mode-btn" 
            onClick={saveComfortTemp}
            disabled={targetTemp === null}
          >
            Appliquer
          </button>
        </div>
      </motion.div>

      {/* Contrôle manuel */}
      <motion.div
        className="control-panel"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <h3>Contrôle manuel</h3>
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'AUTO' ? 'active' : ''}`}
            onClick={() => handleModeChange('AUTO')}
          >
            Mode AUTO
          </button>
          <button
            className={`mode-btn ${mode === 'MANUEL' ? 'active' : ''}`}
            onClick={() => handleModeChange('MANUEL')}
          >
            Mode MANUEL
          </button>
        </div>
        {mode === 'MANUEL' && (
          <div className="manual-controls">
            <div className="control-group">
              <label className="control-label">Chauffage</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={heaterOn}
                  onChange={(e) => setHeaterOn(e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
              <input
                type="range"
                min="0"
                max="5"
                value={heaterLevel}
                className="slider"
                onChange={(e) => setHeaterLevel(Number(e.target.value))}
              />
              <div>Niveau: <span>{heaterLevel}</span></div>
            </div>
            <div className="control-group">
              <label className="control-label">Ventilateur</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={fanOn}
                  onChange={(e) => setFanOn(e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
              <input
                type="range"
                min="0"
                max="5"
                value={fanLevel}
                className="slider"
                onChange={(e) => setFanLevel(Number(e.target.value))}
              />
              <div>Niveau: <span>{fanLevel}</span></div>
            </div>
            <button className="save-btn" onClick={saveManualControls}>
              Sauvegarder les contrôles
            </button>
          </div>
        )}
      </motion.div>

      {/* Boutons pour afficher/masquer les sections détaillées */}
      <motion.div
        className="section-toggle"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <button 
          className={`toggle-btn ${showGraphs ? 'active' : ''}`}
          onClick={() => setShowGraphs(!showGraphs)}
        >
          {showGraphs ? 'Masquer les Graphiques' : 'Afficher les Graphiques'}
        </button>
        <button 
          className={`toggle-btn ${showPredictionsTable ? 'active' : ''}`}
          onClick={() => setShowPredictionsTable(!showPredictionsTable)}
        >
          {showPredictionsTable ? 'Masquer les Prédictions Détaillées' : 'Afficher les Prédictions Détaillées'}
        </button>
      </motion.div>

      {/* Graphiques - Masqués par défaut */}
      {showGraphs && (
        <motion.div
          className="charts-grid"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.4 }}
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '2rem',
            marginTop: '2rem'
          }}
        >
          <div 
            className="chart-container" 
            style={{ 
              height: '400px',
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h3>Température Réelle - 24 dernières heures</h3>
            {temperature24h.length === 0 ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '300px',
                color: '#999'
              }}>
                {loading ? 'Chargement...' : 'Aucune donnée disponible'}
              </div>
            ) : (
              <Line data={realChartData} options={chartOptions} />
            )}
          </div>
          <div 
            className="chart-container" 
            style={{ 
              height: '400px',
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h3>Réel vs Ajustée - 24 heures</h3>
            {predictionVsRealLabels.length === 0 ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '300px',
                color: '#999'
              }}>
                {loading ? 'Chargement...' : 'Aucune donnée disponible pour la comparaison'}
              </div>
            ) : (
              <Line data={predictionVsRealChartData} options={chartOptions} />
            )}
          </div>
        </motion.div>
      )}

      {/* Tableau des prédictions - Masqué par défaut */}
      {showPredictionsTable && (
        <motion.div
          className="ml-prediction"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.4 }}
        >
          <div className="ml-header">
            <h3>Prédictions Intelligentes - 24 prochaines heures</h3>
            <div className="hour-filter">
              <label>Plage horaire:</label>
              <select 
                value={hourFilter} 
                onChange={(e) => setHourFilter(e.target.value)}
                style={{ 
                  padding: '0.5rem', 
                  borderRadius: '4px', 
                  border: '1px solid #d1adc7',
                  backgroundColor: '#f9f9f9'
                }}
              >
                <option value="all">Toutes les heures</option>
                <option value="current">Heure actuelle → 24h</option>
                <option value="morning">Matin (6h-12h)</option>
                <option value="afternoon">Après-midi (12h-18h)</option>
                <option value="evening">Soir (18h-24h)</option>
                <option value="night">Nuit (0h-6h)</option>
              </select>
            </div>
          </div>
          <table className="prediction-table">
            <thead>
              <tr>
                <th>Heure</th>
                <th>Température Prédite</th>
                <th>Température Ajustée</th>
                <th>Chauffage</th>
                <th>Ventilateur</th>
                <th>Niveau Chauffage</th>
                <th>Niveau Ventilateur</th>
              </tr>
            </thead>
            <tbody>
              {filteredPredictions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                    {loading ? 'Chargement...' : 'Aucune donnée de prédiction disponible pour cette plage horaire'}
                  </td>
                </tr>
              ) : (
                filteredPredictions.map((item, index) => {
                  const date = new Date(item.timestamp);
                  const hour = `${date.getHours().toString().padStart(2, '0')}:00`;
                  
                  return (
                    <tr key={index}>
                      <td>{hour}</td>
                      <td>{item.predicted_temp !== null ? `${item.predicted_temp.toFixed(1)}°C` : 'N/A'}</td>
                      <td>{item.adjusted_temp !== null ? `${item.adjusted_temp.toFixed(1)}°C` : 'N/A'}</td>
                      <td>
                        <span className={item.heater_level > 0 ? 'status-on' : 'status-off'}>
                          {item.heater_level > 0 ? 'ON' : 'OFF'}
                        </span>
                      </td>
                      <td>
                        <span className={item.fan_speed > 0 ? 'status-on' : 'status-off'}>
                          {item.fan_speed > 0 ? 'ON' : 'OFF'}
                        </span>
                      </td>
                      <td>{item.heater_level || 0}</td>
                      <td>{item.fan_speed || 0}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </motion.div>
      )}
    </Layout>
  );  
};

export default DashboardPage;