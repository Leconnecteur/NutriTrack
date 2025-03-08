'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import { FoodSearch } from '../components/FoodSearch';
import WeeklyMealPlan from '../components/WeeklyMealPlan';
import { FoodItem } from '../api/food-search';

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

// Types
interface Meal {
  id?: string;
  name: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  date: string;
  mealType: string;
  completed?: boolean;
}

const MealsPage = () => {
  const [user, loading] = useAuthState(auth);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMeal, setNewMeal] = useState<Meal>({
    name: '',
    calories: 0,
    proteins: 0,
    carbs: 0,
    fats: 0,
    date: new Date().toISOString().split('T')[0],
    mealType: 'breakfast'
  });
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<'add' | 'week'>('week');
  const [selectedFoods, setSelectedFoods] = useState<Array<{food: FoodItem, quantity: number}>>([]);
  
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    const fetchMeals = async () => {
      if (user) {
        try {
          setIsLoading(true);
          const mealsRef = collection(db, 'users', user.uid, 'meals');
          const mealsSnapshot = await getDocs(mealsRef);
          
          const mealsData: Meal[] = [];
          mealsSnapshot.forEach((doc) => {
            mealsData.push({
              id: doc.id,
              ...doc.data() as Meal
            });
          });
          
          // Sort by date (newest first)
          mealsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          setMeals(mealsData);
        } catch (error) {
          console.error('Error fetching meals:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (user) {
      fetchMeals();
    }
  }, [user, loading, router]);
  
  const handleFoodSelect = (food: FoodItem, quantity: number) => {
    setSelectedFoods([...selectedFoods, { food, quantity }]);
  };
  
  const handleRemoveFood = (index: number) => {
    const updatedFoods = [...selectedFoods];
    updatedFoods.splice(index, 1);
    setSelectedFoods(updatedFoods);
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
  
  const calculateTotalNutrition = () => {
    let totalCalories = 0;
    let totalProteins = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    
    selectedFoods.forEach(item => {
      totalCalories += Math.round(item.food.nf_calories * item.quantity);
      totalProteins += Math.round(item.food.nf_protein * item.quantity);
      totalCarbs += Math.round(item.food.nf_total_carbohydrate * item.quantity);
      totalFats += Math.round(item.food.nf_total_fat * item.quantity);
    });
    
    return {
      calories: totalCalories,
      proteins: totalProteins,
      carbs: totalCarbs,
      fats: totalFats
    };
  };

  const handleSaveMeal = async () => {
    if (!user || selectedFoods.length === 0) return;
    
    try {
      // Calculer la nutrition totale
      const { calories, proteins, carbs, fats } = calculateTotalNutrition();
      
      // Créer un nom pour le repas basé sur les aliments sélectionnés
      let mealName = selectedFoods.map(item => item.food.food_name).join(', ');
      if (mealName.length > 60) {
        mealName = mealName.substring(0, 57) + '...';
      }
      
      // Préparer l'objet repas
      const mealData: Meal = {
        name: mealName,
        calories,
        proteins,
        carbs,
        fats,
        date: newMeal.date,
        mealType: newMeal.mealType,
        completed: false
      };
      
      // Ajouter le repas à Firestore
      const mealsRef = collection(db, 'users', user.uid, 'meals');
      await addDoc(mealsRef, {
        ...mealData,
        timestamp: serverTimestamp()
      });
      
      // Réinitialiser le formulaire
      setNewMeal({
        name: '',
        calories: 0,
        proteins: 0,
        carbs: 0,
        fats: 0,
        date: new Date().toISOString().split('T')[0],
        mealType: 'breakfast'
      });
      setSelectedFoods([]);
      setView('week');
      
      // Rafraîchir les repas
      const mealsSnapshot = await getDocs(mealsRef);
      const mealsData: Meal[] = [];
      mealsSnapshot.forEach((doc) => {
        mealsData.push({
          id: doc.id,
          ...doc.data() as Meal
        });
      });
      
      // Trier par date (du plus récent au plus ancien)
      mealsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setMeals(mealsData);
    } catch (error) {
      console.error('Error adding meal:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <Header title="Mes Repas" showLogout={true} />
      
      <main className="container mx-auto px-4 py-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.div variants={itemVariants} className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {view === 'week' ? 'Planning des repas' : 'Ajouter un repas'}
            </h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => setView('add')}
                className={`px-4 py-2 ${view === 'add' ? 'bg-green-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'} rounded-lg transition`}
              >
                Ajouter
              </button>
            </div>
          </motion.div>

          {view === 'add' ? (
            <motion.div
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type de repas
                  </label>
                  <select
                    name="mealType"
                    value={newMeal.mealType}
                    onChange={(e) => setNewMeal({...newMeal, mealType: e.target.value})}
                    className="form-control"
                  >
                    <option value="breakfast">Petit-déjeuner</option>
                    <option value="lunch">Déjeuner</option>
                    <option value="dinner">Dîner</option>
                    <option value="snack">Collation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={newMeal.date}
                    onChange={(e) => setNewMeal({...newMeal, date: e.target.value})}
                    className="form-control"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Rechercher des aliments</h3>
                <FoodSearch onFoodSelect={handleFoodSelect} />
                
                {selectedFoods.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Aliments sélectionnés</h3>
                    <div className="space-y-2">
                      {selectedFoods.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <div className="flex items-center">
                            {item.food.photo?.thumb && (
                              <img 
                                src={item.food.photo.thumb} 
                                alt={item.food.food_name} 
                                className="w-10 h-10 rounded-full mr-3 object-cover"
                              />
                            )}
                            <div>
                              <div className="font-medium text-gray-800 dark:text-white">
                                {item.food.food_name} × {item.quantity}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {Math.round(item.food.nf_calories * item.quantity)} kcal · 
                                {Math.round(item.food.nf_protein * item.quantity)}g P · 
                                {Math.round(item.food.nf_total_carbohydrate * item.quantity)}g G · 
                                {Math.round(item.food.nf_total_fat * item.quantity)}g L
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRemoveFood(index)}
                            className="text-red-500 hover:text-red-700 transition"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-800 dark:text-white mb-2">Résumé nutritionnel</h4>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-white dark:bg-gray-800 p-2 rounded text-center">
                          <div className="text-lg font-bold text-green-500">
                            {calculateTotalNutrition().calories}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Calories</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-2 rounded text-center">
                          <div className="text-lg font-bold text-red-500">
                            {calculateTotalNutrition().proteins}g
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Protéines</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-2 rounded text-center">
                          <div className="text-lg font-bold text-blue-500">
                            {calculateTotalNutrition().carbs}g
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Glucides</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-2 rounded text-center">
                          <div className="text-lg font-bold text-yellow-500">
                            {calculateTotalNutrition().fats}g
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Lipides</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={handleSaveMeal}
                        className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                      >
                        Ajouter au plan de repas
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              variants={itemVariants}
              className="space-y-4"
            >
              <WeeklyMealPlan onMealStatusChange={() => {
                // Rafraîchir les repas quand le statut change
                if (user) {
                  const fetchMeals = async () => {
                    const mealsRef = collection(db, 'users', user.uid, 'meals');
                    const mealsSnapshot = await getDocs(mealsRef);
                    
                    const mealsData: Meal[] = [];
                    mealsSnapshot.forEach((doc) => {
                      mealsData.push({
                        id: doc.id,
                        ...doc.data() as Meal
                      });
                    });
                    
                    setMeals(mealsData);
                  };
                  
                  fetchMeals();
                }
              }} />
            </motion.div>
          )}
        </motion.div>
      </main>
      
      <Navigation />
    </div>
  );
};

export default MealsPage;
