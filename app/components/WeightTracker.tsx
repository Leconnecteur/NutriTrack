'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { doc, collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface WeightEntry {
  id: string;
  weight: number;
  date: string;
  timestamp: number;
}

interface WeightTrackerProps {
  currentWeight: number;
}

const WeightTracker = ({ currentWeight }: WeightTrackerProps) => {
  const [user] = useAuthState(auth);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [newWeight, setNewWeight] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      fetchWeightHistory();
    }
  }, [user]);

  const fetchWeightHistory = async () => {
    if (!user) return;

    try {
      const weightsRef = collection(db, 'users', user.uid, 'weights');
      const weightsQuery = query(
        weightsRef, 
        orderBy('timestamp', 'asc')
      );
      const weightsSnapshot = await getDocs(weightsQuery);
      
      const entries: WeightEntry[] = [];
      
      weightsSnapshot.forEach(doc => {
        entries.push({ id: doc.id, ...doc.data() } as WeightEntry);
      });
      
      // S'il n'y a pas encore d'entrées et que l'utilisateur a un poids initial
      if (entries.length === 0 && currentWeight > 0) {
        // Créer une entrée avec le poids actuel de l'utilisateur (défini lors de l'inscription)
        const today = new Date();
        const initialEntry: WeightEntry = {
          id: 'initial',
          weight: currentWeight,
          date: today.toISOString().split('T')[0],
          timestamp: today.getTime()
        };
        entries.push(initialEntry);
      }
      
      setWeightEntries(entries);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique de poids:', error);
    }
  };

  const handleAddWeight = async (e) => {
    e.preventDefault();
    
    if (!user) return;
    
    const weightValue = parseFloat(newWeight);
    if (isNaN(weightValue) || weightValue <= 0) {
      setErrorMessage('Veuillez entrer un poids valide');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      const today = new Date();
      const newEntry = {
        weight: weightValue,
        date: today.toISOString().split('T')[0],
        timestamp: today.getTime(),
      };
      
      await addDoc(collection(db, 'users', user.uid, 'weights'), newEntry);
      
      // Mettre à jour l'état local
      setWeightEntries([...weightEntries, { id: 'temp-' + Date.now(), ...newEntry }]);
      setNewWeight('');
      setSuccessMessage('Nouveau poids enregistré avec succès!');
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      // Recharger les données complètes
      fetchWeightHistory();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du poids:', error);
      setErrorMessage('Erreur lors de l\'enregistrement du poids');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Préparer les données pour le graphique
  const prepareChartData = () => {
    // Limiter aux 7 dernières entrées si plus de 7
    const recentEntries = [...weightEntries].slice(-7);
    
    return {
      labels: recentEntries.map(entry => {
        const date = new Date(entry.date);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      }),
      datasets: [
        {
          label: 'Poids (kg)',
          data: recentEntries.map(entry => entry.weight),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: true,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.parsed.y + ' kg';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return value + ' kg';
          }
        }
      }
    },
    maintainAspectRatio: false,
  };

  // Calculer la différence de poids (si au moins deux entrées)
  const calculateWeightDifference = () => {
    if (weightEntries.length < 2) return null;
    
    const latestWeight = weightEntries[weightEntries.length - 1].weight;
    const previousWeight = weightEntries[weightEntries.length - 2].weight;
    const difference = latestWeight - previousWeight;
    
    return {
      value: Math.abs(difference).toFixed(1),
      isGain: difference > 0,
      isLoss: difference < 0
    };
  };

  const weightDifference = calculateWeightDifference();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Suivi du poids
      </h3>
      
      {/* Affichage du poids actuel et différence */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Poids actuel</h4>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-800 dark:text-white">
              {weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight : currentWeight}
            </span>
            <span className="ml-1 text-lg text-gray-600 dark:text-gray-300">kg</span>
          </div>
          
          {weightDifference && (
            <div className={`flex items-center mt-1 ${weightDifference.isGain ? 'text-red-500' : weightDifference.isLoss ? 'text-green-500' : 'text-gray-500'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                {weightDifference.isGain ? (
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                ) : weightDifference.isLoss ? (
                  <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V7a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                )}
              </svg>
              <span className="text-sm">
                {weightDifference.value} kg {weightDifference.isGain ? 'pris' : weightDifference.isLoss ? 'perdu' : ''}
              </span>
            </div>
          )}
        </div>
        
        {/* Formulaire d'ajout de poids */}
        <form onSubmit={handleAddWeight} className="w-full md:w-auto">
          <div className="flex items-center">
            <input
              type="number"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="Nouveau poids"
              step="0.1"
              min="30"
              max="300"
              className="form-control w-24 mr-2"
              required
            />
            <span className="mr-2">kg</span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Enregistrement...
                </>
              ) : 'Ajouter'}
            </button>
          </div>
          
          {errorMessage && (
            <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
          )}
          
          {successMessage && (
            <p className="text-green-500 text-sm mt-2">{successMessage}</p>
          )}
        </form>
      </div>
      
      {/* Graphique d'évolution du poids */}
      <div className="h-64 mt-6">
        {weightEntries.length > 0 ? (
          <Line data={prepareChartData()} options={chartOptions} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <p>Aucune donnée de poids disponible</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeightTracker;
