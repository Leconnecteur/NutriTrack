import axios from 'axios';

// Types
export interface FoodItem {
  food_name: string;
  serving_qty: number;
  serving_unit: string;
  serving_weight_grams: number;
  nf_calories: number;
  nf_total_fat: number;
  nf_total_carbohydrate: number;
  nf_protein: number;
  photo: {
    thumb: string;
  };
}

export interface SearchResult {
  common: FoodItem[];
  branded: FoodItem[];
}

// API configuration - Utilisation de la API Nutritionix
// Note: Pour une application réelle, ces clés devraient être stockées dans des variables d'environnement
// Ces clés de démonstration peuvent avoir des limitations d'utilisation
const API_CONFIG = {
  headers: {
    'x-app-id': '3b6be50b', // Clé de démonstration 
    'x-app-key': '5c1d721eba7a92ff3eb945a76004ede4', // Clé de démonstration
    'x-remote-user-id': '0'
  }
};

// Rechercher des aliments par nom
export const searchFoodByName = async (query: string): Promise<FoodItem[]> => {
  // D'abord rechercher dans la base de données locale
  const localResults = searchLocalFoods(query);
  
  // Si nous avons des résultats locaux, les retourner sans appeler l'API
  if (localResults.length > 0) {
    console.log(`Résultats trouvés localement pour "${query}" : ${localResults.length} résultats`);
    return localResults;
  }
  
  // Seulement si aucun résultat local n'est trouvé, essayer l'API
  try {
    console.log(`Recherche API pour "${query}"`);
    const response = await axios.get(
      `https://trackapi.nutritionix.com/v2/search/instant?query=${encodeURIComponent(query)}`,
      API_CONFIG
    );
    
    // Retourner les résultats communs et de marque
    return [...response.data.common, ...response.data.branded].slice(0, 10);
  } catch (error) {
    console.error('Erreur lors de la recherche d\'aliments via l\'API:', error);
    // Si aucun résultat local et API en erreur, retourner tableau vide
    return [];
  }
};

// Fonction pour rechercher dans la base de données locale
const searchLocalFoods = (query: string): FoodItem[] => {
  const lowerQuery = query.toLowerCase();
  const results = commonFoods.filter(food => 
    food.food_name.toLowerCase().includes(lowerQuery)
  );
  
  console.log(`Recherche locale pour "${query}" : ${results.length} résultats trouvés`);
  return results;
};

// Obtenir des informations nutritionnelles détaillées pour un aliment
export const getNutritionInfo = async (foodName: string): Promise<FoodItem | null> => {
  // D'abord rechercher dans la base de données locale
  const localResults = searchLocalFoods(foodName);
  if (localResults.length > 0) {
    console.log(`Information nutritionnelle trouvée localement pour "${foodName}"`);
    return localResults[0];
  }
  
  // Seulement si aucun résultat local n'est trouvé, essayer l'API
  try {
    console.log(`Recherche API d'informations nutritionnelles pour "${foodName}"`);
    const response = await axios.post(
      'https://trackapi.nutritionix.com/v2/natural/nutrients',
      { query: foodName },
      API_CONFIG
    );
    
    if (response.data.foods && response.data.foods.length > 0) {
      return response.data.foods[0];
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de l\'obtention des informations nutritionnelles via l\'API:', error);
    return null;
  }
};

// Base de données locale de secours pour les aliments courants
export const commonFoods: FoodItem[] = [
  {
    food_name: 'Oeuf',
    serving_qty: 1,
    serving_unit: 'unité',
    serving_weight_grams: 50,
    nf_calories: 70,
    nf_total_fat: 5,
    nf_total_carbohydrate: 0.5,
    nf_protein: 6,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/542_thumb.jpg' }
  },
  {
    food_name: 'Oeufs',
    serving_qty: 1,
    serving_unit: 'unité',
    serving_weight_grams: 50,
    nf_calories: 70,
    nf_total_fat: 5,
    nf_total_carbohydrate: 0.5,
    nf_protein: 6,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/542_thumb.jpg' }
  },
  {
    food_name: 'Patate douce',
    serving_qty: 1,
    serving_unit: 'moyenne',
    serving_weight_grams: 130,
    nf_calories: 112,
    nf_total_fat: 0.1,
    nf_total_carbohydrate: 26,
    nf_protein: 2,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/417_thumb.jpg' }
  },
  {
    food_name: 'Blanc de poulet',
    serving_qty: 100,
    serving_unit: 'g',
    serving_weight_grams: 100,
    nf_calories: 120,
    nf_total_fat: 1.5,
    nf_total_carbohydrate: 0,
    nf_protein: 26,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/7_thumb.jpg' }
  },
  {
    food_name: 'Poulet',
    serving_qty: 100,
    serving_unit: 'g',
    serving_weight_grams: 100,
    nf_calories: 165,
    nf_total_fat: 3.6,
    nf_total_carbohydrate: 0,
    nf_protein: 31,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/7_thumb.jpg' }
  },
  {
    food_name: 'Steak haché',
    serving_qty: 100,
    serving_unit: 'g',
    serving_weight_grams: 100,
    nf_calories: 141,
    nf_total_fat: 5,
    nf_total_carbohydrate: 0,
    nf_protein: 21,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/867_thumb.jpg' }
  },
  {
    food_name: 'Steak',
    serving_qty: 100,
    serving_unit: 'g',
    serving_weight_grams: 100,
    nf_calories: 141,
    nf_total_fat: 5,
    nf_total_carbohydrate: 0,
    nf_protein: 21,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/867_thumb.jpg' }
  },
  {
    food_name: 'Boeuf haché',
    serving_qty: 100,
    serving_unit: 'g',
    serving_weight_grams: 100,
    nf_calories: 141,
    nf_total_fat: 5,
    nf_total_carbohydrate: 0,
    nf_protein: 21,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/867_thumb.jpg' }
  },
  {
    food_name: 'Jambon',
    serving_qty: 1,
    serving_unit: 'tranche',
    serving_weight_grams: 30,
    nf_calories: 35,
    nf_total_fat: 1,
    nf_total_carbohydrate: 0.5,
    nf_protein: 6,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/783_thumb.jpg' }
  },
  {
    food_name: 'Pain',
    serving_qty: 1,
    serving_unit: 'tranche',
    serving_weight_grams: 30,
    nf_calories: 75,
    nf_total_fat: 1,
    nf_total_carbohydrate: 15,
    nf_protein: 2,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/225_thumb.jpg' }
  },
  {
    food_name: 'Riz',
    serving_qty: 100,
    serving_unit: 'g cuit',
    serving_weight_grams: 100,
    nf_calories: 130,
    nf_total_fat: 0.3,
    nf_total_carbohydrate: 28,
    nf_protein: 2.7,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/1378_thumb.jpg' }
  },
  {
    food_name: 'Pomme',
    serving_qty: 1,
    serving_unit: 'moyenne',
    serving_weight_grams: 182,
    nf_calories: 95,
    nf_total_fat: 0.3,
    nf_total_carbohydrate: 25,
    nf_protein: 0.5,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/384_thumb.jpg' }
  },
  {
    food_name: 'Salade',
    serving_qty: 100,
    serving_unit: 'g',
    serving_weight_grams: 100,
    nf_calories: 15,
    nf_total_fat: 0.2,
    nf_total_carbohydrate: 2.9,
    nf_protein: 1.4,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/8_thumb.jpg' }
  },
  {
    food_name: 'Courgette',
    serving_qty: 100,
    serving_unit: 'g',
    serving_weight_grams: 100,
    nf_calories: 17,
    nf_total_fat: 0.3,
    nf_total_carbohydrate: 3.1,
    nf_protein: 1.2,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/524_thumb.jpg' }
  },
  {
    food_name: 'Concombre',
    serving_qty: 100,
    serving_unit: 'g',
    serving_weight_grams: 100,
    nf_calories: 15,
    nf_total_fat: 0.1,
    nf_total_carbohydrate: 3.6,
    nf_protein: 0.7,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/513_thumb.jpg' }
  },
  {
    food_name: 'Galette de maïs',
    serving_qty: 1,
    serving_unit: 'galette',
    serving_weight_grams: 30,
    nf_calories: 110,
    nf_total_fat: 1.5,
    nf_total_carbohydrate: 23,
    nf_protein: 2,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/814_thumb.jpg' }
  },
  {
    food_name: 'Galette de blé complet',
    serving_qty: 1,
    serving_unit: 'galette',
    serving_weight_grams: 35,
    nf_calories: 95,
    nf_total_fat: 1,
    nf_total_carbohydrate: 16,
    nf_protein: 3,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/1130_thumb.jpg' }
  },
  {
    food_name: 'Tomate',
    serving_qty: 1,
    serving_unit: 'moyenne',
    serving_weight_grams: 123,
    nf_calories: 22,
    nf_total_fat: 0.2,
    nf_total_carbohydrate: 4.8,
    nf_protein: 1.1,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/436_thumb.jpg' }
  },
  {
    food_name: 'Carotte',
    serving_qty: 1,
    serving_unit: 'moyenne',
    serving_weight_grams: 61,
    nf_calories: 25,
    nf_total_fat: 0.1,
    nf_total_carbohydrate: 5.8,
    nf_protein: 0.6,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/516_thumb.jpg' }
  },
  {
    food_name: 'Brocoli',
    serving_qty: 100,
    serving_unit: 'g',
    serving_weight_grams: 100,
    nf_calories: 34,
    nf_total_fat: 0.4,
    nf_total_carbohydrate: 6.6,
    nf_protein: 2.8,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/520_thumb.jpg' }
  },
  {
    food_name: 'Avocat',
    serving_qty: 1,
    serving_unit: 'moyen',
    serving_weight_grams: 150,
    nf_calories: 240,
    nf_total_fat: 22,
    nf_total_carbohydrate: 12.8,
    nf_protein: 3,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/441_thumb.jpg' }
  },
  {
    food_name: 'Yaourt nature',
    serving_qty: 1,
    serving_unit: 'pot',
    serving_weight_grams: 125,
    nf_calories: 59,
    nf_total_fat: 0.2,
    nf_total_carbohydrate: 5.7,
    nf_protein: 5.3,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/690_thumb.jpg' }
  },
  {
    food_name: 'Lentilles',
    serving_qty: 100,
    serving_unit: 'g cuites',
    serving_weight_grams: 100,
    nf_calories: 116,
    nf_total_fat: 0.4,
    nf_total_carbohydrate: 20,
    nf_protein: 9,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/683_thumb.jpg' }
  },
  {
    food_name: 'Quinoa',
    serving_qty: 100,
    serving_unit: 'g cuit',
    serving_weight_grams: 100,
    nf_calories: 120,
    nf_total_fat: 1.9,
    nf_total_carbohydrate: 21.3,
    nf_protein: 4.4,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/787_thumb.jpg' }
  },
  {
    food_name: 'Poisson blanc',
    serving_qty: 100,
    serving_unit: 'g',
    serving_weight_grams: 100,
    nf_calories: 96,
    nf_total_fat: 2.3,
    nf_total_carbohydrate: 0,
    nf_protein: 20.5,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/1038_thumb.jpg' }
  },
  {
    food_name: 'Saumon',
    serving_qty: 100,
    serving_unit: 'g',
    serving_weight_grams: 100,
    nf_calories: 206,
    nf_total_fat: 12.4,
    nf_total_carbohydrate: 0,
    nf_protein: 22.1,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/1590_thumb.jpg' }
  },
  {
    food_name: 'Lait',
    serving_qty: 100,
    serving_unit: 'ml',
    serving_weight_grams: 100,
    nf_calories: 60,
    nf_total_fat: 3.2,
    nf_total_carbohydrate: 4.8,
    nf_protein: 3.2,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/554_thumb.jpg' }
  },
  {
    food_name: 'Yaourt',
    serving_qty: 125,
    serving_unit: 'g',
    serving_weight_grams: 125,
    nf_calories: 75,
    nf_total_fat: 3,
    nf_total_carbohydrate: 6,
    nf_protein: 5,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/558_thumb.jpg' }
  },
  {
    food_name: 'Pâtes',
    serving_qty: 100,
    serving_unit: 'g cuites',
    serving_weight_grams: 100,
    nf_calories: 158,
    nf_total_fat: 0.9,
    nf_total_carbohydrate: 31,
    nf_protein: 5.8,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/193_thumb.jpg' }
  },
  {
    food_name: 'Banane',
    serving_qty: 1,
    serving_unit: 'moyenne',
    serving_weight_grams: 118,
    nf_calories: 105,
    nf_total_fat: 0.4,
    nf_total_carbohydrate: 27,
    nf_protein: 1.3,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/399_thumb.jpg' }
  },
  {
    food_name: 'Fromage',
    serving_qty: 30,
    serving_unit: 'g',
    serving_weight_grams: 30,
    nf_calories: 120,
    nf_total_fat: 10,
    nf_total_carbohydrate: 0.5,
    nf_protein: 7,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/512_thumb.jpg' }
  },
  {
    food_name: 'Thon',
    serving_qty: 100,
    serving_unit: 'g',
    serving_weight_grams: 100,
    nf_calories: 108,
    nf_total_fat: 0.8,
    nf_total_carbohydrate: 0,
    nf_protein: 25,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/1001_thumb.jpg' }
  },
  {
    food_name: 'Saumon',
    serving_qty: 100,
    serving_unit: 'g',
    serving_weight_grams: 100,
    nf_calories: 208,
    nf_total_fat: 13,
    nf_total_carbohydrate: 0,
    nf_protein: 20,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/87_thumb.jpg' }
  },
  {
    food_name: 'Avocat',
    serving_qty: 1,
    serving_unit: 'moyen',
    serving_weight_grams: 150,
    nf_calories: 240,
    nf_total_fat: 22,
    nf_total_carbohydrate: 12,
    nf_protein: 3,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/441_thumb.jpg' }
  },
  {
    food_name: 'Lentilles',
    serving_qty: 100,
    serving_unit: 'g cuites',
    serving_weight_grams: 100,
    nf_calories: 116,
    nf_total_fat: 0.4,
    nf_total_carbohydrate: 20,
    nf_protein: 9,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/661_thumb.jpg' }
  },
  {
    food_name: 'Huile d\'olive',
    serving_qty: 1,
    serving_unit: 'cuillère',
    serving_weight_grams: 14,
    nf_calories: 120,
    nf_total_fat: 14,
    nf_total_carbohydrate: 0,
    nf_protein: 0,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/501_thumb.jpg' }
  },
  {
    food_name: 'Huile',
    serving_qty: 1,
    serving_unit: 'cuillère',
    serving_weight_grams: 14,
    nf_calories: 120,
    nf_total_fat: 14,
    nf_total_carbohydrate: 0,
    nf_protein: 0,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/501_thumb.jpg' }
  },
  {
    food_name: 'Beurre',
    serving_qty: 1,
    serving_unit: 'cuillère',
    serving_weight_grams: 14,
    nf_calories: 100,
    nf_total_fat: 11,
    nf_total_carbohydrate: 0,
    nf_protein: 0,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/503_thumb.jpg' }
  },
  {
    food_name: 'Pomme de terre',
    serving_qty: 1,
    serving_unit: 'moyenne',
    serving_weight_grams: 150,
    nf_calories: 130,
    nf_total_fat: 0.2,
    nf_total_carbohydrate: 30,
    nf_protein: 3,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/416_thumb.jpg' }
  },
  {
    food_name: 'Pommes de terre',
    serving_qty: 1,
    serving_unit: 'moyenne',
    serving_weight_grams: 150,
    nf_calories: 130,
    nf_total_fat: 0.2,
    nf_total_carbohydrate: 30,
    nf_protein: 3,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/416_thumb.jpg' }
  },
  {
    food_name: 'Tomate',
    serving_qty: 1,
    serving_unit: 'moyenne',
    serving_weight_grams: 123,
    nf_calories: 22,
    nf_total_fat: 0.2,
    nf_total_carbohydrate: 4.8,
    nf_protein: 1.1,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/1103_thumb.jpg' }
  },
  {
    food_name: 'Carotte',
    serving_qty: 1,
    serving_unit: 'moyenne',
    serving_weight_grams: 60,
    nf_calories: 25,
    nf_total_fat: 0.1,
    nf_total_carbohydrate: 6,
    nf_protein: 0.6,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/448_thumb.jpg' }
  },
  {
    food_name: 'Haricots verts',
    serving_qty: 100,
    serving_unit: 'g cuits',
    serving_weight_grams: 100,
    nf_calories: 35,
    nf_total_fat: 0.1,
    nf_total_carbohydrate: 7,
    nf_protein: 1.9,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/708_thumb.jpg' }
  },
  {
    food_name: 'Quinoa',
    serving_qty: 100,
    serving_unit: 'g cuit',
    serving_weight_grams: 100,
    nf_calories: 120,
    nf_total_fat: 1.9,
    nf_total_carbohydrate: 21,
    nf_protein: 4.4,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/775_thumb.jpg' }
  },
  {
    food_name: 'Amandes',
    serving_qty: 30,
    serving_unit: 'g',
    serving_weight_grams: 30,
    nf_calories: 173,
    nf_total_fat: 15,
    nf_total_carbohydrate: 6.1,
    nf_protein: 6.3,
    photo: { thumb: 'https://nix-tag-images.s3.amazonaws.com/529_thumb.jpg' }
  }
];

// Fonction de secours pour rechercher des aliments localement
export const searchFoodLocally = (query: string): FoodItem[] => {
  if (!query) return [];
  
  // Normaliser la recherche (supprimer les accents, mettre en minuscules)
  const normalizeString = (str: string) => {
    return str.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");  // Supprime les accents
  };
  
  const searchTermNormalized = normalizeString(query);
  
  // Priorité d'affichage - correspondance exacte d'abord, puis partielle
  const results = commonFoods.filter(food => {
    const foodNameNormalized = normalizeString(food.food_name);
    return foodNameNormalized.includes(searchTermNormalized);
  });
  
  // Tri pour mettre en premier les correspondances exactes
  return results.sort((a, b) => {
    const aName = normalizeString(a.food_name);
    const bName = normalizeString(b.food_name);
    
    // Si un nom commence par la recherche mais pas l'autre
    if (aName.startsWith(searchTermNormalized) && !bName.startsWith(searchTermNormalized)) {
      return -1;
    }
    if (!aName.startsWith(searchTermNormalized) && bName.startsWith(searchTermNormalized)) {
      return 1;
    }
    
    // Si un nom est la recherche exacte mais pas l'autre
    if (aName === searchTermNormalized && bName !== searchTermNormalized) {
      return -1;
    }
    if (aName !== searchTermNormalized && bName === searchTermNormalized) {
      return 1; 
    }
    
    // Sinon, trier par ordre alphabétique
    return aName.localeCompare(bName);
  });
};
