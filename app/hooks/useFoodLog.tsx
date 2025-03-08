import { useState, useCallback, useEffect } from 'react';
import { FoodItem } from '../api/food-search';

interface FoodLogItem extends FoodItem {
  id: string;
  timestamp: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export const useFoodLog = () => {
  const [foodLog, setFoodLog] = useState<FoodLogItem[]>([]);
  
  // Charger les données du localStorage au démarrage
  useEffect(() => {
    const savedLog = localStorage.getItem('nutritrack-food-log');
    if (savedLog) {
      try {
        setFoodLog(JSON.parse(savedLog));
      } catch (error) {
        console.error('Erreur lors du chargement du journal alimentaire:', error);
      }
    }
  }, []);
  
  // Sauvegarder dans localStorage à chaque modification
  useEffect(() => {
    if (foodLog.length > 0) {
      localStorage.setItem('nutritrack-food-log', JSON.stringify(foodLog));
    }
  }, [foodLog]);

  // Ajouter un aliment au journal (par défaut dans la catégorie "snack")
  const addFoodItem = useCallback((food: FoodItem, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'snack') => {
    const newItem: FoodLogItem = {
      ...food,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      mealType
    };
    
    setFoodLog(prevLog => [...prevLog, newItem]);
    return newItem.id;
  }, []);

  // Supprimer un aliment du journal
  const removeFoodItem = useCallback((id: string) => {
    setFoodLog(prevLog => prevLog.filter(item => item.id !== id));
  }, []);

  // Récupérer les aliments par type de repas
  const getFoodsByMeal = useCallback((mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    return foodLog.filter(item => item.mealType === mealType);
  }, [foodLog]);

  // Calculer les statistiques nutritionnelles totales
  const getTotalNutrition = useCallback(() => {
    return foodLog.reduce((totals, item) => {
      return {
        calories: totals.calories + item.nf_calories,
        protein: totals.protein + item.nf_protein,
        carbs: totals.carbs + item.nf_total_carbohydrate,
        fat: totals.fat + item.nf_total_fat
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [foodLog]);

  return {
    foodLog,
    addFoodItem,
    removeFoodItem,
    getFoodsByMeal,
    getTotalNutrition
  };
};
