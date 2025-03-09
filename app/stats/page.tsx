'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
// import de Chart.js retiré car nous utilisons notre adaptateur personnalisé
// Importation de notre adaptateur de graphiques au lieu de react-chartjs-2
import ChartAdapter from '../components/ChartAdapter';

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
}

interface UserData {
  firstName: string;
  lastName: string;
  dailyCaloriesGoal?: number;
  age?: number;
  weight?: number;
  height?: number;
  activityLevel?: string;
  email?: string;
  createdAt?: string;
  gender?: string;
}

const StatsPage = () => {
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week'); // 'week', 'month', 'year'
  
  const router = useRouter();

  // Get the date range based on the selected option
  const getDateRange = () => {
    const today = new Date();
    const startDate = new Date();
    
    if (dateRange === 'week') {
      startDate.setDate(today.getDate() - 7);
    } else if (dateRange === 'month') {
      startDate.setMonth(today.getMonth() - 1);
    } else if (dateRange === 'year') {
      startDate.setFullYear(today.getFullYear() - 1);
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    const fetchData = async () => {
      if (user) {
        try {
          setIsLoading(true);
          
          // Fetch user data
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          }
          
          // Fetch meals
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
          console.error('Error fetching data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, loading, router]);

  // Filter meals based on date range
  const filteredMeals = () => {
    const { start, end } = getDateRange();
    return meals.filter(meal => meal.date >= start && meal.date <= end);
  };

  // Calculate daily averages
  const calculateDailyAverages = () => {
    const meals = filteredMeals();
    const dateMap = new Map();
    
    meals.forEach(meal => {
      if (!dateMap.has(meal.date)) {
        dateMap.set(meal.date, {
          calories: 0,
          proteins: 0,
          carbs: 0,
          fats: 0,
          count: 0
        });
      }
      
      const dateStats = dateMap.get(meal.date);
      dateStats.calories += meal.calories;
      dateStats.proteins += meal.proteins;
      dateStats.carbs += meal.carbs;
      dateStats.fats += meal.fats;
      dateStats.count += 1;
    });
    
    const totalDays = dateMap.size;
    if (totalDays === 0) return { calories: 0, proteins: 0, carbs: 0, fats: 0 };
    
    let totalCalories = 0;
    let totalProteins = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    
    dateMap.forEach(stats => {
      totalCalories += stats.calories;
      totalProteins += stats.proteins;
      totalCarbs += stats.carbs;
      totalFats += stats.fats;
    });
    
    return {
      calories: Math.round(totalCalories / totalDays),
      proteins: Math.round(totalProteins / totalDays),
      carbs: Math.round(totalCarbs / totalDays),
      fats: Math.round(totalFats / totalDays)
    };
  };

  // Prepare data for calories chart
  const prepareCaloriesChartData = () => {
    const meals = filteredMeals();
    const dateMap = new Map();
    
    meals.forEach(meal => {
      if (!dateMap.has(meal.date)) {
        dateMap.set(meal.date, 0);
      }
      
      dateMap.set(meal.date, dateMap.get(meal.date) + meal.calories);
    });
    
    // Sort dates
    const sortedDates = Array.from(dateMap.keys()).sort();
    
    return {
      labels: sortedDates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      }),
      datasets: [
        {
          label: 'Calories consommées',
          data: sortedDates.map(date => dateMap.get(date)),
          borderColor: 'rgb(76, 175, 80)',
          backgroundColor: 'rgba(76, 175, 80, 0.5)',
          tension: 0.3,
        },
        {
          label: 'Objectif calorique',
          data: sortedDates.map(() => userData?.dailyCaloriesGoal || 2000),
          borderColor: 'rgb(255, 152, 0)',
          backgroundColor: 'rgba(255, 152, 0, 0.5)',
          borderDash: [5, 5],
          tension: 0.1,
        },
      ],
    };
  };

  // Prepare data for macronutrient chart
  const prepareMacroChartData = () => {
    const { proteins, carbs, fats } = calculateDailyAverages();
    
    return {
      labels: ['Protéines', 'Glucides', 'Lipides'],
      datasets: [
        {
          label: 'Macronutriments (g)',
          data: [proteins, carbs, fats],
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare data for meal type distribution
  const prepareMealTypeData = () => {
    const meals = filteredMeals();
    const mealTypeMap = new Map();
    
    meals.forEach(meal => {
      if (!mealTypeMap.has(meal.mealType)) {
        mealTypeMap.set(meal.mealType, 0);
      }
      
      mealTypeMap.set(meal.mealType, mealTypeMap.get(meal.mealType) + 1);
    });
    
    const mealTypeLabels = {
      breakfast: 'Petit-déjeuner',
      lunch: 'Déjeuner',
      dinner: 'Dîner',
      snack: 'Collation',
    };
    
    return {
      labels: Array.from(mealTypeMap.keys()).map(type => mealTypeLabels[type] || type),
      datasets: [
        {
          data: Array.from(mealTypeMap.values()),
          backgroundColor: [
            'rgba(76, 175, 80, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(255, 206, 86, 0.6)',
          ],
          borderColor: [
            'rgba(76, 175, 80, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <Header title="Mes Statistiques" showLogout={true} />
      
      <main className="container mx-auto px-4 py-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.div variants={itemVariants} className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Statistiques nutritionnelles
            </h2>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="form-control w-auto"
            >
              <option value="week">7 derniers jours</option>
              <option value="month">30 derniers jours</option>
              <option value="year">12 derniers mois</option>
            </select>
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="loading w-8 h-8"></div>
            </div>
          ) : meals.length === 0 ? (
            <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Vous n'avez pas encore enregistré de repas. Ajoutez des repas dans la section "Repas" pour voir vos statistiques.
              </p>
            </motion.div>
          ) : (
            <>
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Calories Moyennes</h3>
                  <p className="text-2xl font-bold text-green-500">{calculateDailyAverages().calories} <span className="text-sm">kcal/jour</span></p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Protéines Moyennes</h3>
                  <p className="text-2xl font-bold text-red-500">{calculateDailyAverages().proteins} <span className="text-sm">g/jour</span></p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Glucides Moyens</h3>
                  <p className="text-2xl font-bold text-blue-500">{calculateDailyAverages().carbs} <span className="text-sm">g/jour</span></p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Lipides Moyens</h3>
                  <p className="text-2xl font-bold text-yellow-500">{calculateDailyAverages().fats} <span className="text-sm">g/jour</span></p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Évolution des calories</h3>
                <div className="h-64">
                  <ChartAdapter.Line options={chartOptions} data={prepareCaloriesChartData()} />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Répartition des macronutriments</h3>
                  <div className="h-64">
                    <ChartAdapter.Bar options={chartOptions} data={prepareMacroChartData()} />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Distribution par type de repas</h3>
                  <div className="h-64">
                    <ChartAdapter.Doughnut options={doughnutOptions} data={prepareMealTypeData()} />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </motion.div>
      </main>
      
      <Navigation />
    </div>
  );
};

export default StatsPage;
