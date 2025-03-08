import React, { useState, useEffect } from 'react';
import { searchFoodByName, searchFoodLocally, FoodItem } from '../api/food-search';
import { Input, Button } from "../components/ui/form-elements";
import { Card } from "../components/ui/card";
import Image from 'next/image';

interface FoodSearchProps {
  onFoodSelect?: (food: FoodItem, quantity: number) => void;
}

export const FoodSearch: React.FC<FoodSearchProps> = ({ onFoodSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Effectuer la recherche lorsque l'utilisateur tape
  useEffect(() => {
    const searchFood = async () => {
      if (!query) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        // Rechercher d'abord localement
        const localResults = searchFoodLocally(query);
        
        // Si des résultats locaux sont trouvés, les afficher
        if (localResults.length > 0) {
          setResults(localResults);
          setLoading(false);
          return;
        }
        
        // Sinon, rechercher via l'API
        const apiResults = await searchFoodByName(query);
        setResults(apiResults);
      } catch (err) {
        console.error('Erreur lors de la recherche d\'aliments:', err);
        setError('Une erreur est survenue lors de la recherche. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    // Débounce pour éviter trop d'appels API
    const timeoutId = setTimeout(() => {
      searchFood();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFoodItem(food);
  };

  const handleAddFood = () => {
    if (selectedFoodItem) {
      // Ajuster les valeurs nutritionnelles en fonction de la quantité
      const adjustedItem = {
        ...selectedFoodItem,
        serving_qty: selectedFoodItem.serving_qty * quantity,
        serving_weight_grams: selectedFoodItem.serving_weight_grams * quantity,
        nf_calories: Math.round(selectedFoodItem.nf_calories * quantity),
        nf_total_fat: Math.round(selectedFoodItem.nf_total_fat * quantity * 10) / 10,
        nf_total_carbohydrate: Math.round(selectedFoodItem.nf_total_carbohydrate * quantity * 10) / 10,
        nf_protein: Math.round(selectedFoodItem.nf_protein * quantity * 10) / 10,
      };
      
      // Appeler la fonction de callback avec l'aliment ajusté si elle existe
      if (onFoodSelect) {
        onFoodSelect(adjustedItem, quantity);
      }
      
      // Réinitialiser après l'ajout
      setSelectedFoodItem(null);
      setQuantity(1);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="relative">
        <Input
          className="w-full p-2 border rounded"
          type="text"
          placeholder="Rechercher un aliment (ex: pomme, poulet, riz...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && (
          <div className="absolute right-3 top-2">
            <div className="animate-spin h-5 w-5 border-t-2 border-blue-500 rounded-full"></div>
          </div>
        )}
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {selectedFoodItem ? (
        <Card className="p-4 border rounded shadow-sm">
          <div className="flex items-center gap-4">
            {selectedFoodItem.photo?.thumb && (
              <div className="w-16 h-16 relative overflow-hidden rounded">
                <Image 
                  src={selectedFoodItem.photo.thumb} 
                  alt={selectedFoodItem.food_name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-medium">{selectedFoodItem.food_name}</h3>
              <div className="flex gap-4 text-sm text-gray-600">
                <div>
                  <span className="text-gray-800">{Math.round(selectedFoodItem.nf_calories * quantity)}</span> calories
                </div>
                <div>
                  <span className="text-gray-800">{(selectedFoodItem.nf_protein * quantity).toFixed(1)}g</span> protéines
                </div>
                <div>
                  <span className="text-gray-800">{(selectedFoodItem.nf_total_carbohydrate * quantity).toFixed(1)}g</span> glucides
                </div>
                <div>
                  <span className="text-gray-800">{(selectedFoodItem.nf_total_fat * quantity).toFixed(1)}g</span> lipides
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <label htmlFor="quantity" className="text-sm">Quantité:</label>
                <Input
                  id="quantity"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-20 p-1 text-sm border rounded"
                />
                <span className="text-sm text-gray-600">{selectedFoodItem.serving_unit}</span>
                <span className="mx-2 text-sm text-gray-400">•</span>
                <span className="text-sm text-gray-600">{(selectedFoodItem.serving_weight_grams * quantity).toFixed(0)}g</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={handleAddFood} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                  Ajouter
                </Button>
                <Button onClick={() => setSelectedFoodItem(null)} className="border bg-white hover:bg-gray-100 px-3 py-1 rounded text-sm">
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {results.length > 0 ? (
            results.map((food, index) => (
              <Card
                key={`${food.food_name}-${index}`}
                className="p-3 border rounded flex items-center cursor-pointer hover:bg-gray-50"
                onClick={() => handleSelectFood(food)}
              >
                {food.photo?.thumb && (
                  <div className="w-12 h-12 relative overflow-hidden rounded mr-3">
                    <Image
                      src={food.photo.thumb}
                      alt={food.food_name}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{food.food_name}</h3>
                  <div className="text-sm text-gray-600">
                    {food.serving_qty} {food.serving_unit} ({food.serving_weight_grams}g) • {food.nf_calories} calories
                  </div>
                </div>
              </Card>
            ))
          ) : query && !loading ? (
            <p className="text-gray-500">Aucun résultat trouvé pour "{query}"</p>
          ) : null}
        </div>
      )}
    </div>
  );
};
