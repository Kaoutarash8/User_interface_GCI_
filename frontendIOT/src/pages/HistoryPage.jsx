import React, { useMemo, useState, useEffect } from 'react';
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
import jsPDF from 'jspdf';
import { getHistory } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const HistoryPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avgTemp, setAvgTemp] = useState(null);
  const [heaterHours, setHeaterHours] = useState(0);
  const [fanHours, setFanHours] = useState(0);

  // Charger les données historiques
  const loadHistory = async () => {
    setLoading(true);
    const date = new Date(selectedDate);
    const result = await getHistory(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
    
    if (result.success && result.data) {
      setHistoryData(result.data);
      
      // Calculer les statistiques
      if (result.data.temperature_data && result.data.temperature_data.length > 0) {
        const temps = result.data.temperature_data.map((item) => item.indoor_temp);
        const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
        setAvgTemp(avg.toFixed(1));
        
        // Compter les heures de chauffage et ventilateur
        const heaterCount = result.data.temperature_data.filter(
          (item) => item.heater_level && item.heater_level > 0
        ).length;
        const fanCount = result.data.temperature_data.filter(
          (item) => item.fan_level && item.fan_level > 0
        ).length;
        setHeaterHours(heaterCount);
        setFanHours(fanCount);
      } else {
        setAvgTemp(null);
        setHeaterHours(0);
        setFanHours(0);
      }
    } else {
      setHistoryData(null);
      setAvgTemp(null);
      setHeaterHours(0);
      setFanHours(0);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, [selectedDate]);

  // Transformer les données pour l'affichage
  const rows = useMemo(() => {
    if (!historyData || !historyData.temperature_data) return [];
    
    return historyData.temperature_data.map((tempItem) => {
      // Trouver la prédiction correspondante
      const pred = historyData.predictions?.find(
        (p) =>
          p.year === tempItem.year &&
          p.month === tempItem.month &&
          p.day === tempItem.day &&
          p.hour === tempItem.hour
      );
      
      const date = new Date(tempItem.timestamp);
      return {
        date: `${date.toISOString().split('T')[0]} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
        real: tempItem.indoor_temp,
        predicted: pred ? pred.predicted_temp : null,
        heater: { 
          on: tempItem.heater_level > 0, 
          level: tempItem.heater_level || 0 
        },
        fan: { 
          on: tempItem.fan_level > 0, 
          level: tempItem.fan_level || 0 
        },
        mode: 'AUTO'
      };
    }).reverse(); // Plus récent en premier
  }, [historyData]);

  const handleExportCSV = () => {
    if (rows.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }
    
    const header = [
      'Date & Heure',
      'Température réelle',
      'Température prédite',
      'Chauffage',
      'Ventilateur',
      'Mode'
    ];
    const csvRows = rows.map((r) => [
      r.date,
      `${r.real}°C`,
      `${r.predicted !== null ? `${r.predicted}°C` : 'N/A'}`,
      `${r.heater.on ? 'ON' : 'OFF'} (Niv. ${r.heater.level})`,
      `${r.fan.on ? 'ON' : 'OFF'} (Niv. ${r.fan.level})`,
      r.mode
    ]);

    const csvContent = [header, ...csvRows]
      .map((line) => line.join(';'))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'historique_climat.csv');
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (rows.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }
    
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Historique - Système de Climat', 14, 16);
    doc.setFontSize(10);
    let y = 26;
    rows.slice(0, 20).forEach((r) => {
      const line = `${r.date} | Réel: ${r.real}°C | Prédit: ${r.predicted !== null ? `${r.predicted}°C` : 'N/A'} | Chauffage: ${
        r.heater.on ? 'ON' : 'OFF'
      }(${r.heater.level}) | Ventilateur: ${
        r.fan.on ? 'ON' : 'OFF'
      }(${r.fan.level}) | ${r.mode}`;
      doc.text(line, 14, y);
      y += 6;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save('historique_climat.pdf');
  };

  const labels = rows.length > 0 ? rows.map((r) => r.date.split(' ')[1]) : [];

  // Graphique Évolution température réelle (SEULEMENT réel)
  const realTempChartData = {
    labels,
    datasets: [
      {
        label: 'Température Réelle',
        data: rows.length > 0 ? rows.map((r) => r.real) : [],
        borderColor: 'rgba(209, 173, 199, 1)',
        backgroundColor: 'rgba(209, 173, 199, 0.3)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgba(209, 173, 199, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }
    ]
  };

  // Graphique Comparaison ML vs Réel (les deux)
  const comparisonChartData = {
    labels,
    datasets: [
      {
        label: 'Température Réelle',
        data: rows.length > 0 ? rows.map((r) => r.real) : [],
        borderColor: 'rgba(209, 173, 199, 1)',
        backgroundColor: 'rgba(209, 173, 199, 0.3)',
        tension: 0.4,
        fill: false,
        pointBackgroundColor: 'rgba(209, 173, 199, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      },
      {
        label: 'Température Prédite (ML)',
        data: rows.length > 0 ? rows.map((r) => r.predicted) : [],
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

  // Graphique Temps de fonctionnement avec lignes droites (pas de courbes)
  const usageChartData = {
    labels,
    datasets: [
      {
        label: 'Niveau Chauffage',
        data: rows.length > 0 ? rows.map((r) => r.heater.level) : [],
        borderColor: 'rgba(209, 173, 199, 1)',
        backgroundColor: 'rgba(209, 173, 199, 0.3)',
        tension: 0, // Ligne droite, pas de courbe
        fill: false,
        pointBackgroundColor: 'rgba(209, 173, 199, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        stepped: false // Ligne droite entre les points
      },
      {
        label: 'Niveau Ventilateur',
        data: rows.length > 0 ? rows.map((r) => r.fan.level) : [],
        borderColor: 'rgba(102, 126, 234, 1)',
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        tension: 0, // Ligne droite, pas de courbe
        fill: false,
        pointBackgroundColor: 'rgba(102, 126, 234, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        stepped: false // Ligne droite entre les points
      }
    ]
  };

  const tempChartOptions = {
    responsive: true,
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
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value) => `${value}°C`
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    }
  };

  const usageChartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Permet de contrôler la hauteur
    plugins: {
      legend: { 
        display: true,
        position: 'top'
      },
      tooltip: { 
        enabled: true,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y || 0}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
          callback: (value) => `${value}`
        }
      }
    }
  };

  return (
    <Layout>
      <div className="stats-grid">
        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="stat-value">
            {loading ? '...' : avgTemp !== null ? `${avgTemp}°C` : 'N/A'}
          </div>
          <div className="stat-label">Température moyenne</div>
        </motion.div>
        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <div className="stat-value">{loading ? '...' : `${heaterHours}h`}</div>
          <div className="stat-label">Heures chauffage activé</div>
        </motion.div>
        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="stat-value">{loading ? '...' : `${fanHours}h`}</div>
          <div className="stat-label">Heures ventilateur activé</div>
        </motion.div>
      </div>

      <motion.div
        className="filters"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="filters-header">
          <h3>Filtres</h3>
          <div className="export-buttons">
            <button className="apply-btn" onClick={handleExportCSV}>
              Export CSV
            </button>
            <button className="apply-btn secondary" onClick={handleExportPDF}>
              Export PDF
            </button>
          </div>
        </div>
        <div className="filter-group">
          <div className="date-range" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
            <label style={{ fontWeight: '500' }}>Sélectionner une date:</label>
            <input
              type="date"
              className="date-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button className="apply-btn" onClick={loadHistory}>
              Actualiser
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="data-table"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <h3 style={{ marginBottom: '1rem', color: '#555', fontWeight: 600 }}>
          Historique des données - {selectedDate}
          {rows.length > 0 && ` (${rows.length} enregistrements)`}
        </h3>
        <table>
          <thead>
            <tr>
              <th>Date &amp; Heure</th>
              <th>Température réelle</th>
              <th>Température prédite</th>
              <th>Chauffage</th>
              <th>Ventilateur</th>
              <th>Mode</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                  Chargement...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                  Aucune donnée disponible pour cette date
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
              <motion.tr
                key={row.date + index}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
              >
                <td>{row.date}</td>
                <td>{row.real.toFixed(1)}°C</td>
                <td>{row.predicted !== null ? `${row.predicted.toFixed(1)}°C` : 'N/A'}</td>
                <td>
                  <span className={row.heater.on ? 'status-on' : 'status-off'}>
                    {row.heater.on ? 'ON' : 'OFF'}
                  </span>{' '}
                  (Niv. {row.heater.level})
                </td>
                <td>
                  <span className={row.fan.on ? 'status-on' : 'status-off'}>
                    {row.fan.on ? 'ON' : 'OFF'}
                  </span>{' '}
                  (Niv. {row.fan.level})
                </td>
                <td>{row.mode}</td>
              </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>

      {rows.length > 0 && (
        <>
          <motion.div
            className="charts-grid"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="chart-container">
              <h3>Évolution température réelle</h3>
              <Line data={realTempChartData} options={tempChartOptions} />
            </div>
            <div className="chart-container">
              <h3>Comparaison ML vs Réel</h3>
              <Line data={comparisonChartData} options={tempChartOptions} />
            </div>
          </motion.div>

          {/* Graphique Temps de fonctionnement - plus petit et centré */}
          <motion.div
            className="chart-container-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            style={{ 
              maxWidth: '800px', 
              margin: '0 auto',
              height: '300px' // Hauteur réduite
            }}
          >
            <h3>Temps de fonctionnement</h3>
            <Line data={usageChartData} options={usageChartOptions} />
          </motion.div>
        </>
      )}

      {/* Ajout de styles CSS */}
      <style jsx>{`
        .chart-container-center {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          margin-top: 2rem;
          margin-bottom: 2rem;
        }
        
        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }
        
        .chart-container {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          height: 400px; // Hauteur standard pour les deux premiers graphiques
        }
      `}</style>
    </Layout>
  );
};

export default HistoryPage;