'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDoughnutChart, useLineChart } from './SimpleCharts';

interface CalorieStatsProps {
  dailyGoal: number;
  consumed: number;
  planned?: number;
  weeklyData?: { day: string; calories: number }[];
}

const CalorieStats = ({ dailyGoal, consumed, planned = 0, weeklyData = [] }: CalorieStatsProps) => {
  const [remaining, setRemaining] = useState(dailyGoal - consumed - planned);
  const [percentage, setPercentage] = useState(0);
  
  useEffect(() => {
    // Le restant exclut à la fois les calories déjà consommées et celles planifiées
    setRemaining(dailyGoal - consumed - planned);
    // Le pourcentage concerne uniquement les calories déjà consommées
    setPercentage(Math.min(Math.round((consumed / dailyGoal) * 100), 100));
  }, [dailyGoal, consumed, planned]);

  // Données pour le graphique en anneau
  const doughnutData = {
    labels: ['Consommées', 'Planifiées', 'Restantes'],
    datasets: [
      {
        data: [
          consumed, 
          planned, 
          remaining > 0 ? remaining : 0
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',  // Bleu pour consommées
          'rgba(255, 159, 64, 0.8)',  // Orange pour planifiées
          'rgba(211, 211, 211, 0.8)',  // Gris pour restantes
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(211, 211, 211, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Données pour le graphique en ligne
  const lineData = {
    labels: weeklyData.map(item => item.day),
    datasets: [
      {
        label: 'Calories consommées',
        data: weeklyData.map(item => item.calories),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const doughnutOptions = {
    cutout: '70%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return context.label + ': ' + context.parsed + ' kcal';
          }
        }
      }
    },
    maintainAspectRatio: false,
  };

  const lineOptions = {
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return context.dataset.label + ': ' + context.parsed.y + ' kcal';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        min: Math.min(...weeklyData.map(d => d.calories)) * 0.9,
        grid: {
          color: 'rgba(200, 200, 200, 0.1)',
        },
        ticks: {
          font: {
            family: "'Geist', sans-serif",
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: "'Geist', sans-serif",
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.3,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      }
    },
    maintainAspectRatio: false,
  };

  // État pour suivre si le composant est monté côté client ou non
  const [isClient, setIsClient] = useState(false);

  // Détection du côté client
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Préparer les données pour le graphique linéaire
  const lineChartData = weeklyData.map(item => ({
    label: item.day,
    value: item.calories
  }));
  
  // Utiliser useEffect pour appliquer les hooks de graphiques
  useEffect(() => {
    if (isClient) {
      // Créer le graphique circulaire
      useDoughnutChart('doughnut-container', percentage, consumed + planned > dailyGoal ? '#ef4444' : '#3b82f6');
      
      // Créer le graphique linéaire
      useLineChart('line-container', lineChartData, 'Calories');
    }
  }, [isClient, percentage, consumed, planned, dailyGoal, lineChartData]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex flex-col items-center justify-between gap-6">
        {/* Section du graphique en anneau - toujours visible sur mobile */}
        <div className="w-full flex flex-col items-center">
          <div className="relative w-48 h-48 md:w-56 md:h-56">
            {!isClient ? (
              <div className="w-full h-full rounded-full border-4 border-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-pulse mb-2 bg-gray-300 h-8 w-16 mx-auto rounded"></div>
                  <div className="text-gray-400">Chargement...</div>
                </div>
              </div>
            ) : (
              <div id="doughnut-container" className="w-full h-full"></div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${consumed + planned > dailyGoal ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>
                {percentage}%
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">consommées</span>
            </div>
          </div>
          <div className="mt-4 text-center w-full">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Consommées</p>
                <p className={`text-xl font-bold ${consumed + planned > dailyGoal ? 'text-red-500' : 'text-blue-500'}`}>
                  {consumed} <span className="text-sm">kcal</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Planifiées</p>
                <p className={`text-xl font-bold ${consumed + planned > dailyGoal ? 'text-red-500' : 'text-orange-500'}`}>
                  {planned} <span className="text-sm">kcal</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Restantes</p>
                <p className={`text-xl font-bold ${consumed + planned > dailyGoal ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>
                  {remaining > 0 ? remaining : 0} <span className="text-sm">kcal</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Graphique en ligne - s'adapte en hauteur sur mobile */}
        <div className="w-full h-60 mt-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 text-center">Historique de la semaine</h3>
          {!isClient ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="animate-pulse mb-2 bg-gray-300 h-4 w-32 mx-auto rounded"></div>
                <div className="animate-pulse mb-2 bg-gray-300 h-4 w-24 mx-auto rounded"></div>
                <div className="text-gray-400">Chargement de l'historique...</div>
              </div>
            </div>
          ) : (
            <div id="line-container" className="w-full h-full"></div>
          )}
          {/* Les graphiques sont créés via useEffect */}
        </div>
      </div>
    </div>
  );
};

export default CalorieStats;
