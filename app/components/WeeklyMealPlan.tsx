import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc as firestoreDoc,
  Timestamp 
} from 'firebase/firestore';

interface Meal {
  id: string;
  name: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  date: string;
  mealType: string;
  completed?: boolean;
  timestamp?: Timestamp;
}

interface MealsByDay {
  [key: string]: {
    date: string;
    displayDate: string;
    dayName: string;
    meals: Meal[];
  };
}

interface WeeklyMealPlanProps {
  onMealStatusChange: () => void;
}

const WeeklyMealPlan = ({ onMealStatusChange }: WeeklyMealPlanProps) => {
  const [user] = useAuthState(auth);
  const [weeklyMeals, setWeeklyMeals] = useState<MealsByDay>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const getStartOfMonth = () => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    return startDate;
  };
  
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);

  const generateMonthDays = () => {
    const startOfMonth = getStartOfMonth();
    // Appliquer le décalage du mois (pour la navigation)
    startOfMonth.setMonth(startOfMonth.getMonth() + currentMonthOffset);
    
    const days: { date: string; displayDate: string; dayName: string }[] = [];
    
    // Obtenir le nombre de jours dans le mois
    const daysInMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0).getDate();
    
    // Générer un jour pour chaque jour du mois
    for (let i = 0; i < daysInMonth; i++) {
      const currentDate = new Date(startOfMonth);
      currentDate.setDate(startOfMonth.getDate() + i);
      
      // Utiliser une méthode qui garantit que la date est basée sur l'heure locale, pas UTC
      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const dayName = currentDate.toLocaleDateString('fr-FR', { weekday: 'short' });
      const displayDate = currentDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      
      days.push({ date: dateString, displayDate, dayName });
    }
    
    return days;
  };

  const fetchMonthlyMeals = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const monthDays = generateMonthDays();
      const startDate = monthDays[0].date;
      const endDate = monthDays[monthDays.length - 1].date;
      
      // Récupérer tous les repas de la semaine
      const mealsRef = collection(db, 'users', user.uid, 'meals');
      const mealsQuery = query(
        mealsRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
      
      const mealsSnapshot = await getDocs(mealsQuery);
      
      // Initialiser la structure des repas par jour
      const mealsByDay: MealsByDay = {};
      monthDays.forEach(day => {
        mealsByDay[day.date] = {
          date: day.date,
          displayDate: day.displayDate,
          dayName: day.dayName,
          meals: []
        };
      });
      
      // Remplir avec les repas existants
      mealsSnapshot.forEach(doc => {
        const meal = { id: doc.id, ...doc.data() } as Meal;
        if (mealsByDay[meal.date]) {
          mealsByDay[meal.date].meals.push(meal);
        }
      });
      
      // Trier les repas par type de repas pour chaque jour
      Object.keys(mealsByDay).forEach(date => {
        const mealTypeOrder = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };
        mealsByDay[date].meals.sort((a, b) => mealTypeOrder[a.mealType] - mealTypeOrder[b.mealType]);
      });
      
      setWeeklyMeals(mealsByDay);
      
      // Définir le jour sélectionné par défaut (aujourd'hui ou le premier jour avec des repas)
      // Utiliser une méthode qui génère une date locale pour éviter le décalage
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      if (mealsByDay[today] && mealsByDay[today].meals.length > 0) {
        setSelectedDay(today);
      } else {
        // Trouver le premier jour avec des repas
        const firstDayWithMeals = Object.keys(mealsByDay).find(date => mealsByDay[date].meals.length > 0);
        if (firstDayWithMeals) {
          setSelectedDay(firstDayWithMeals);
        } else {
          // Si aucun jour n'a de repas, sélectionner aujourd'hui ou le premier jour de la semaine
          setSelectedDay(mealsByDay[today] ? today : Object.keys(mealsByDay)[0]);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des repas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMonthlyMeals();
    }
  }, [user, currentMonthOffset]);

  const toggleMealCompleted = async (dayDate: string, mealId: string) => {
    if (!user) return;
    
    try {
      // Mettre à jour l'état localement
      const updatedMeals = { ...weeklyMeals };
      const mealIndex = updatedMeals[dayDate].meals.findIndex(meal => meal.id === mealId);
      
      if (mealIndex !== -1) {
        updatedMeals[dayDate].meals[mealIndex].completed = !updatedMeals[dayDate].meals[mealIndex].completed;
        setWeeklyMeals(updatedMeals);
      }
      
      // Mettre à jour dans Firestore
      const mealRef = firestoreDoc(db, 'users', user.uid, 'meals', mealId);
      await updateDoc(mealRef, {
        completed: updatedMeals[dayDate].meals[mealIndex].completed
      });
      
      // Notifier le composant parent
      onMealStatusChange();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut du repas:', error);
    }
  };

  const getMealTypeLabel = (type: string) => {
    switch (type) {
      case 'breakfast': return 'Petit-déjeuner';
      case 'lunch': return 'Déjeuner';
      case 'dinner': return 'Dîner';
      case 'snack': return 'Collation';
      default: return type;
    }
  };

  const getMealTypeIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return '🍳';
      case 'lunch': return '🍲';
      case 'dinner': return '🍽️';
      case 'snack': return '🥨';
      default: return '🍴';
    }
  };

  // Vérifier si une date est aujourd'hui
  const isToday = (date: string) => {
    // Crée une date basée sur l'heure locale pour éviter les problèmes de fuseau horaire
    const now = new Date();
    // Utilise exactement le même format que pour les dates des jours
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return date === today;
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="loading w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Navigation entre les mois */}
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={() => setCurrentMonthOffset(prev => prev - 1)}
          className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-medium">
          {new Date(new Date().setMonth(new Date().getMonth() + currentMonthOffset)).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </h3>
        <button 
          onClick={() => setCurrentMonthOffset(prev => prev + 1)}
          className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Onglets des jours du mois */}
      <div className="flex space-x-1 overflow-x-auto pb-2 hide-scrollbar">
        {Object.values(weeklyMeals).map((dayData) => (
          <button
            key={dayData.date}
            onClick={() => setSelectedDay(dayData.date)}
            className={`flex-shrink-0 px-3 py-2 rounded-lg transition-colors ${
              selectedDay === dayData.date
                ? 'bg-green-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30'
            } ${isToday(dayData.date) ? 'font-bold ring-2 ring-green-300 dark:ring-green-700' : ''}`}
          >
            <div className="text-center">
              <div className="text-xs uppercase font-medium">{dayData.dayName}</div>
              <div className="text-sm">{dayData.displayDate}</div>
              {dayData.meals.length > 0 && (
                <div className="mt-1 flex justify-center">
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 rounded-full">
                    {dayData.meals.length}
                  </span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Affichage des repas du jour sélectionné */}
      {selectedDay && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
        >
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {new Date(selectedDay).toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                day: 'numeric',
                month: 'long'
              })}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {weeklyMeals[selectedDay].meals.length} repas planifiés
            </p>
          </div>

          {weeklyMeals[selectedDay].meals.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Aucun repas planifié pour cette journée
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {weeklyMeals[selectedDay].meals.map((meal) => (
                <div key={meal.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3" aria-hidden="true">
                        {getMealTypeIcon(meal.mealType)}
                      </div>
                      <div>
                        <div className="flex items-center">
                          <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 rounded mr-2">
                            {getMealTypeLabel(meal.mealType)}
                          </span>
                          <h4 className="font-medium text-gray-800 dark:text-white">
                            {meal.name}
                          </h4>
                        </div>
                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-2">
                          <span>{meal.calories} kcal</span>
                          <span>•</span>
                          <span>{meal.proteins}g P</span>
                          <span>•</span>
                          <span>{meal.carbs}g G</span>
                          <span>•</span>
                          <span>{meal.fats}g L</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => toggleMealCompleted(selectedDay, meal.id)}
                        className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center ${
                          meal.completed
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {meal.completed ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default WeeklyMealPlan;
