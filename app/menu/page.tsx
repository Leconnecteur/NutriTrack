'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, doc, getDoc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Navigation from '../components/Navigation';

interface Meal {
  id: string;
  name: string;
  description: string;
  calories: number;
  consumed: boolean;
}

interface DayMeals {
  date: string;
  meals: Meal[];
}

export default function Menu() {
  const [user, loading] = useAuthState(auth);
  const [weekMeals, setWeekMeals] = useState<DayMeals[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [newMeal, setNewMeal] = useState<Omit<Meal, 'id' | 'consumed'>>({
    name: '',
    description: '',
    calories: 0,
  });
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    // Charger les données des repas pour la semaine
    const fetchWeekMeals = async () => {
      if (user) {
        try {
          // Initialiser la structure des 7 jours de la semaine
          const today = new Date();
          const weekDays: DayMeals[] = [];
          
          for (let i = 0; i < 7; i++) {
            const day = new Date(today);
            day.setDate(today.getDate() + i);
            
            const dateStr = day.toISOString().split('T')[0];
            const dayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(day);
            const dayNumber = day.getDate();
            const formattedDate = `${dayName} ${dayNumber}`;
            
            weekDays.push({
              date: formattedDate,
              meals: [],
            });
          }

          // À remplacer par une requête Firestore pour obtenir les repas de la semaine
          // Pour l'instant, utilisons des données fictives
          const fakeMeals: Meal[] = [
            { id: '1', name: 'Petit-déjeuner', description: 'Œufs, pain complet, avocat', calories: 450, consumed: true },
            { id: '2', name: 'Déjeuner', description: 'Salade de poulet, riz', calories: 650, consumed: false },
            { id: '3', name: 'Collation', description: 'Yaourt, fruits', calories: 100, consumed: false },
            { id: '4', name: 'Dîner', description: 'Saumon, légumes verts', calories: 550, consumed: false },
          ];
          
          weekDays[0].meals = fakeMeals;
          
          setWeekMeals(weekDays);
        } catch (error) {
          console.error('Erreur lors du chargement des repas:', error);
        }
      }
    };

    fetchWeekMeals();
  }, [user, loading, router]);

  const handleToggleConsumed = (mealId: string) => {
    setWeekMeals(prevWeekMeals => {
      const updatedWeekMeals = [...prevWeekMeals];
      const dayMeals = updatedWeekMeals[selectedDay];
      
      if (dayMeals) {
        const updatedMeals = dayMeals.meals.map(meal => {
          if (meal.id === mealId) {
            return { ...meal, consumed: !meal.consumed };
          }
          return meal;
        });
        
        dayMeals.meals = updatedMeals;
      }
      
      return updatedWeekMeals;
    });
  };

  const handleGenerateMenu = async () => {
    setIsGenerating(true);
    
    try {
      // Ici, vous appelleriez l'API ChatGPT pour générer un menu
      // Simulation d'un délai d'API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const generatedMeals: Meal[] = [
        { id: '5', name: 'Petit-déjeuner', description: 'Smoothie protéiné, céréales complètes', calories: 400, consumed: false },
        { id: '6', name: 'Déjeuner', description: 'Bowl de quinoa et légumes, poulet grillé', calories: 550, consumed: false },
        { id: '7', name: 'Collation', description: 'Noix et fruits secs', calories: 150, consumed: false },
        { id: '8', name: 'Dîner', description: 'Tofu sauté, légumes et riz brun', calories: 500, consumed: false },
      ];
      
      setWeekMeals(prevWeekMeals => {
        const updatedWeekMeals = [...prevWeekMeals];
        
        if (updatedWeekMeals[selectedDay]) {
          updatedWeekMeals[selectedDay].meals = generatedMeals;
        }
        
        return updatedWeekMeals;
      });
    } catch (error) {
      console.error('Erreur lors de la génération du menu:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddMeal = () => {
    if (!newMeal.name || !newMeal.description || newMeal.calories <= 0) return;
    
    const meal: Meal = {
      id: Date.now().toString(),
      name: newMeal.name,
      description: newMeal.description,
      calories: newMeal.calories,
      consumed: false,
    };
    
    setWeekMeals(prevWeekMeals => {
      const updatedWeekMeals = [...prevWeekMeals];
      
      if (updatedWeekMeals[selectedDay]) {
        updatedWeekMeals[selectedDay].meals = [...updatedWeekMeals[selectedDay].meals, meal];
      }
      
      return updatedWeekMeals;
    });
    
    setNewMeal({
      name: '',
      description: '',
      calories: 0,
    });
    
    setShowAddMeal(false);
  };
  
  const handleNewMealChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewMeal(prev => ({
      ...prev,
      [name]: name === 'calories' ? parseInt(value) || 0 : value,
    }));
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <Header title="Menu hebdomadaire" showLogout={true} />
      
      <main className="container mx-auto px-4 py-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
              Planification des repas
            </h3>
            
            {/* Navigation des jours de la semaine */}
            <div className="flex overflow-x-auto pb-2 mb-4 -mx-2 px-2">
              {weekMeals.map((day, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDay(index)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg mr-2 transition-colors ${
                    selectedDay === index
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {day.date}
                </button>
              ))}
            </div>
            
            {/* Liste des repas pour le jour sélectionné */}
            <div className="space-y-4 mb-6">
              {weekMeals[selectedDay]?.meals.length > 0 ? (
                weekMeals[selectedDay].meals.map(meal => (
                  <motion.div 
                    key={meal.id}
                    whileHover={{ scale: 1.01 }}
                    className={`flex justify-between items-center p-4 rounded-lg border transition-colors ${
                      meal.consumed
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={meal.consumed}
                        onChange={() => handleToggleConsumed(meal.id)}
                        className="mt-1 h-5 w-5 text-blue-500 rounded focus:ring-blue-500"
                      />
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-white">{meal.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{meal.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-blue-500 font-semibold">{meal.calories} kcal</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  Aucun repas planifié pour ce jour
                </div>
              )}
            </div>
            
            {/* Boutons d'action */}
            <div className="flex flex-wrap gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddMeal(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Ajouter un repas
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerateMenu}
                disabled={isGenerating}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
              >
                {isGenerating && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isGenerating ? 'Génération en cours...' : 'Générer un menu avec IA'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </main>
      
      {/* Modal pour ajouter un repas */}
      {showAddMeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Ajouter un repas
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="mealName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom du repas
                </label>
                <input
                  id="mealName"
                  name="name"
                  type="text"
                  value={newMeal.name}
                  onChange={handleNewMealChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Petit-déjeuner"
                />
              </div>
              
              <div>
                <label htmlFor="mealDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="mealDescription"
                  name="description"
                  value={newMeal.description}
                  onChange={handleNewMealChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Œufs, pain complet, avocat"
                  rows={3}
                />
              </div>
              
              <div>
                <label htmlFor="mealCalories" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Calories
                </label>
                <input
                  id="mealCalories"
                  name="calories"
                  type="number"
                  min="0"
                  value={newMeal.calories}
                  onChange={handleNewMealChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: 450"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddMeal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddMeal}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Ajouter
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      <Navigation />
    </div>
  );
}
