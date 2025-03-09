'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import CalorieStats from '../components/CalorieStats';
import WeightTracker from '../components/WeightTracker';

interface UserData {
  firstName: string;
  lastName: string;
  dailyCaloriesGoal?: number;
  dailyProteinGoal?: number;
  age?: number;
  weight?: number;
  height?: number;
  activityLevel?: string;
  fitnessGoal?: string;
  email?: string;
  createdAt?: string;
  gender?: string;
}

interface MealData {
  id: string;
  name: string;
  mealType: string;
  calories: number;
  completed?: boolean;
  [key: string]: any;
}

export default function Dashboard() {
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [caloriesPlanned, setCaloriesPlanned] = useState(0);
  const [todayMeals, setTodayMeals] = useState<MealData[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [weeklyData, setWeeklyData] = useState([
    { day: 'Lun', calories: 1800 },
    { day: 'Mar', calories: 2100 },
    { day: 'Mer', calories: 1950 },
    { day: 'Jeu', calories: 2200 },
    { day: 'Ven', calories: 2050 },
    { day: 'Sam', calories: 1900 },
    { day: 'Dim', calories: 1750 },
  ]);
  const router = useRouter();

  // Calculer les calories quotidiennes en fonction des données utilisateur
  const calculateDailyCalories = (data: UserData): number => {
    if (!data.age || !data.weight || !data.height) return 2000;

    // Formule de Harris-Benedict
    let bmr = 0;
    
    // Calculer le BMR en fonction du genre
    if (data.gender === 'female') {
      bmr = 655 + (9.6 * data.weight) + (1.8 * data.height) - (4.7 * data.age);
    } else {
      bmr = 66 + (13.7 * data.weight) + (5 * data.height) - (6.8 * data.age);
    }
    
    // Ajuster en fonction du niveau d'activité
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55, 
      active: 1.725,
      veryActive: 1.9
    };
    
    const activityLevel = data.activityLevel || 'moderate';
    const multiplier = activityMultipliers[activityLevel] || 1.55;
    return Math.round(bmr * multiplier);
  };
  
  // Calculer l'objectif de protéines quotidiennes en fonction du poids et du niveau d'activité
  const calculateDailyProtein = (data: UserData): number => {
    if (!data.weight) return 120; // Valeur par défaut si pas de poids
    
    // Facteurs de protéines basés sur le niveau d'activité (grammes par kg de poids corporel)
    const proteinFactors: Record<string, number> = {
      sedentary: 1.6,  // Même sédentaire, besoin d'un apport suffisant
      light: 1.8,      // Activité légère
      moderate: 2.0,   // Activité modérée
      active: 2.2,     // Personne active
      veryActive: 2.4  // Personne très active
    };
    
    // Ajustement en fonction de l'objectif fitness
    const goalFactors: Record<string, number> = {
      weightLoss: 1.2,       // Perte de poids - besoin de plus de protéines pour préserver la masse musculaire
      maintenance: 1.0,      // Maintien
      muscleGain: 1.2,       // Prise de muscle
      performance: 1.1       // Performance
    };
    
    const activityLevel = data.activityLevel || 'moderate';
    const fitnessGoal = data.fitnessGoal || 'maintenance';
    
    const baseFactor = proteinFactors[activityLevel] || 2.0;
    const goalFactor = goalFactors[fitnessGoal] || 1.0;
    
    return Math.round(data.weight * baseFactor * goalFactor);
  };

  // Fonction pour récupérer les repas du jour
  const fetchTodayMeals = async () => {
    if (!user) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const mealsRef = collection(db, 'users', user.uid, 'meals');
      const mealsQuery = query(mealsRef, where('date', '==', today));
      const mealsSnapshot = await getDocs(mealsQuery);
      
      const meals: MealData[] = [];
      let consumedCalories = 0;
      let plannedCalories = 0;
      
      mealsSnapshot.forEach(doc => {
        const mealData = { id: doc.id, ...doc.data() } as MealData;
        meals.push(mealData);
        
        // Si le repas est marqué comme complété, ajouter aux calories consommées
        // Sinon, ajouter aux calories planifiées (mais pas encore consommées)
        if (mealData.completed) {
          consumedCalories += mealData.calories || 0;
        } else {
          plannedCalories += mealData.calories || 0;
        }
      });
      
      // Trier les repas par type dans un ordre logique
      const mealTypeOrder: Record<string, number> = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };
      meals.sort((a, b) => {
        const aOrder = mealTypeOrder[a.mealType] || 999;
        const bOrder = mealTypeOrder[b.mealType] || 999;
        return aOrder - bOrder;
      });
      
      setTodayMeals(meals);
      setCaloriesConsumed(consumedCalories);
      setCaloriesPlanned(plannedCalories);
    } catch (error) {
      console.error('Erreur lors de la récupération des repas:', error);
    }
  };
  
  // Fonction pour marquer un repas comme terminé
  const markMealAsCompleted = async () => {
    if (!user || !selectedMealId) return;
    
    try {
      const mealRef = doc(db, 'users', user.uid, 'meals', selectedMealId);
      await updateDoc(mealRef, { completed: true });
      
      // Mettre à jour l'état local
      const updatedMeals = todayMeals.map(meal => 
        meal.id === selectedMealId ? { ...meal, completed: true } : meal
      );
      
      // Mettre à jour les calories consommées et planifiées
      const completedMeal = todayMeals.find(meal => meal.id === selectedMealId);
      if (completedMeal) {
        setCaloriesConsumed(prev => prev + (completedMeal.calories || 0));
        setCaloriesPlanned(prev => prev - (completedMeal.calories || 0));
      }
      
      setTodayMeals(updatedMeals);
      setSelectedMealId(null);
    } catch (error) {
      console.error('Erreur lors de la validation du repas:', error);
    }
  };

  // Rediriger si non authentifié
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Charger les données utilisateur
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        setUserDataLoading(true);
        
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const data = userDoc.data() as UserData;
          
          if (!data.dailyCaloriesGoal) {
            data.dailyCaloriesGoal = calculateDailyCalories(data);
          }
          
          setUserData(data);
        } else {
          const defaultUserData: UserData = {
            firstName: user.displayName?.split(' ')[0] || 'Utilisateur',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
            email: user.email || '',
            dailyCaloriesGoal: 2000,
            createdAt: new Date().toISOString()
          };
          
          await setDoc(doc(db, 'users', user.uid), defaultUserData);
          setUserData(defaultUserData);
        }
      } catch (error) {
        console.error('Erreur:', error);
        setUserData(null);
      } finally {
        setUserDataLoading(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);
  
  // Charger les repas du jour
  useEffect(() => {
    if (user) {
      fetchTodayMeals();
    }
  }, [user]);

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

  if (loading || userDataLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Chargement de votre tableau de bord...</p>
      </div>
    );
  }

  // Si userData est null après le chargement, c'est qu'il y a eu un problème
  if (!userData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-red-500 mb-4">Impossible de charger vos données.</p>
        <button 
          onClick={() => router.push('/auth/login')} 
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
        >
          Retourner à la page de connexion
        </button>
      </div>
    );
  }

  // Déterminer une valeur par défaut pour dailyCaloriesGoal si elle n'existe pas
  const dailyCaloriesGoal = userData.dailyCaloriesGoal || 2000;
  
  // Calculer l'objectif de protéines
  const dailyProteinGoal = calculateDailyProtein(userData);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <Header title="Tableau de bord" showLogout={true} />
      
      <main className="container mx-auto px-4 py-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Bonjour, {userData.firstName} 👋
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Voici un résumé de votre journée
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="w-full">
            <CalorieStats 
              dailyGoal={dailyCaloriesGoal} 
              consumed={caloriesConsumed}
              planned={caloriesPlanned}
              weeklyData={weeklyData}
            />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div 
              variants={itemVariants}
              className="bg-green-500 dark:bg-green-600 text-white rounded-lg p-6 shadow-sm"
            >
              <h3 className="text-xl font-bold mb-2">Calories</h3>
              <p className="text-3xl font-bold">{dailyCaloriesGoal} <span className="text-sm">kcal</span></p>
              <p className="text-sm opacity-80">Objectif quotidien</p>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              className="bg-orange-500 dark:bg-orange-600 text-white rounded-lg p-6 shadow-sm"
            >
              <h3 className="text-xl font-bold mb-2">Protéines</h3>
              <p className="text-3xl font-bold">{dailyProteinGoal} <span className="text-sm">g</span></p>
              <p className="text-sm opacity-80">Objectif quotidien</p>
            </motion.div>
          </div>



          <motion.div 
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold mb-4">
              Repas d'aujourd'hui
            </h3>
            
            {/* Liste des repas réels */}
            <div className="space-y-4">
              {todayMeals.length > 0 ? (
                todayMeals.map(meal => (
                  <div 
                    key={meal.id}
                    onClick={() => setSelectedMealId(meal.id === selectedMealId ? null : meal.id)}
                    className={`flex justify-between items-center p-3 ${meal.completed ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-700'} rounded-lg cursor-pointer ${meal.id === selectedMealId ? 'ring-2 ring-green-500' : ''} ${meal.completed ? 'opacity-70' : ''}`}
                  >
                    <div className="flex items-center">
                      {meal.completed && (
                        <div className="flex-shrink-0 mr-3 text-green-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-white">
                          {meal.mealType === 'breakfast' ? 'Petit-déjeuner' : 
                           meal.mealType === 'lunch' ? 'Déjeuner' : 
                           meal.mealType === 'dinner' ? 'Dîner' : 'Collation'}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{meal.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-orange-500 font-semibold">{meal.calories} kcal</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <p>Aucun repas prévu pour aujourd'hui</p>
                  <p className="text-sm mt-2">Ajoutez des repas dans la section "Mes Repas"</p>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => selectedMealId ? markMealAsCompleted() : router.push('/meals')}
              disabled={selectedMealId && todayMeals.find(m => m.id === selectedMealId)?.completed}
              className={`mt-4 w-full p-2 ${selectedMealId ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg transition flex items-center justify-center ${(selectedMealId && todayMeals.find(m => m.id === selectedMealId)?.completed) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {selectedMealId ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {todayMeals.find(m => m.id === selectedMealId)?.completed ? 'Repas déjà validé' : 'Valider ce repas'}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Gérer mes repas
                </>
              )}
            </button>
          </motion.div>
          
          {/* Section de suivi du poids */}
          <motion.div 
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg shadow-sm mt-6"
          >
            <WeightTracker currentWeight={userData.weight || 0} />
          </motion.div>
        </motion.div>
      </main>
      
      <Navigation />
    </div>
  );
}
