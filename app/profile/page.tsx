'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Navigation from '../components/Navigation';

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

interface UserData {
  firstName: string;
  lastName: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: string;
  activityLevel?: string;
  fitnessGoal?: string;
  dailyCaloriesGoal?: number;
  dailyProteinGoal?: number;
  email?: string;
  createdAt?: string;
}

const ProfilePage = () => {
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<UserData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    const fetchUserData = async () => {
      if (user) {
        try {
          setIsLoading(true);
          
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            setUserData(data);
            setEditedData(data);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user, loading, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData({
      ...editedData,
      [name]: name === 'firstName' || name === 'lastName' || name === 'gender' || name === 'activityLevel' || name === 'fitnessGoal' || name === 'email' 
        ? value 
        : Number(value)
    });
  };

  // Objectifs et leurs facteurs multiplicateurs pour le calcul des calories
  const fitnessGoals = [
    { id: 'weightLoss', label: 'Perte de poids', factor: 0.8 }, // Déficit calorique de 20%
    { id: 'maintenance', label: 'Maintien du poids', factor: 1.0 }, // Maintenance
    { id: 'muscleGain', label: 'Prise de masse musculaire', factor: 1.1 }, // Surplus de 10%
    { id: 'extremeGain', label: 'Prise de masse importante', factor: 1.2 }, // Surplus de 20%
  ];

  const calculateDailyCalories = () => {
    if (!editedData) return 0;
    
    const { age, weight, height, gender, activityLevel, fitnessGoal } = editedData;
    
    // Vérifier que toutes les valeurs nécessaires sont présentes et sont des nombres valides
    if (!age || !weight || !height || isNaN(age) || isNaN(weight) || isNaN(height)) {
      return 0; // Retourner 0 si des valeurs sont manquantes ou invalides
    }
    
    // Harris-Benedict formula with activity multiplier
    let bmr = 0;
    
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else if (gender === 'female') {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    } else {
      // Non-binary or unspecified - average of male and female formula
      const maleBmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
      const femaleBmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
      bmr = (maleBmr + femaleBmr) / 2;
    }
    
    // Apply activity multiplier
    let activityMultiplier = 1.2; // Default: sedentary
    
    switch (activityLevel) {
      case 'sedentary':
        activityMultiplier = 1.2;
        break;
      case 'light':
        activityMultiplier = 1.375;
        break;
      case 'moderate':
        activityMultiplier = 1.55;
        break;
      case 'active':
        activityMultiplier = 1.725;
        break;
      case 'very_active':
        activityMultiplier = 1.9;
        break;
    }
    
    // Appliquer le facteur d'objectif
    const goalFactor = fitnessGoals.find(goal => goal.id === fitnessGoal)?.factor || 1.0;
    
    const calories = Math.round(bmr * activityMultiplier * goalFactor);
    return isNaN(calories) ? 0 : calories; // Vérification finale pour éviter NaN
  };
  
  const calculateDailyProtein = () => {
    if (!editedData?.weight) return 0;
    
    // Facteurs de protéines basés sur le niveau d'activité (grammes par kg de poids corporel)
    const proteinFactors: Record<string, number> = {
      sedentary: 1.6,  // Même sédentaire, besoin d'un apport suffisant
      light: 1.8,      // Activité légère
      moderate: 2.0,   // Activité modérée
      active: 2.2,     // Personne active
      very_active: 2.4 // Personne très active
    };
    
    // Ajustement en fonction de l'objectif fitness
    const goalFactors: Record<string, number> = {
      weightLoss: 1.2,       // Perte de poids - besoin de plus de protéines pour préserver la masse musculaire
      maintenance: 1.0,      // Maintien
      muscleGain: 1.2,       // Prise de muscle
      extremeGain: 1.1       // Prise de masse importante
    };
    
    const { weight, activityLevel, fitnessGoal } = editedData;
    
    const baseFactor = proteinFactors[activityLevel || 'moderate'] || 2.0;
    const goalFactor = goalFactors[fitnessGoal || 'maintenance'] || 1.0;
    
    const protein = Math.round(weight * baseFactor * goalFactor);
    return isNaN(protein) ? 0 : protein;
  };

  const handleSave = async () => {
    if (!user || !editedData) return;
    
    try {
      setIsSaving(true);
      setSuccessMessage('');
      setErrorMessage('');
      
      // Calculate daily goals
      const dailyCaloriesGoal = calculateDailyCalories();
      const dailyProteinGoal = calculateDailyProtein();
      
      // Update user data in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        ...editedData,
        dailyCaloriesGoal,
        dailyProteinGoal,
      });
      
      // Update local state
      setUserData({
        ...editedData,
        dailyCaloriesGoal,
        dailyProteinGoal,
      });
      
      setSuccessMessage('Profil mis à jour avec succès');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('Une erreur est survenue lors de la mise à jour du profil');
    } finally {
      setIsSaving(false);
    }
  };

  const getActivityLevelLabel = (level: string) => {
    switch (level) {
      case 'sedentary': return 'Sédentaire';
      case 'light': return 'Légèrement actif';
      case 'moderate': return 'Modérément actif';
      case 'active': return 'Très actif';
      case 'very_active': return 'Extrêmement actif';
      default: return level;
    }
  };

  const getFitnessGoalLabel = (goal: string) => {
    switch (goal) {
      case 'weightLoss': return 'Perte de poids';
      case 'maintenance': return 'Maintien du poids';
      case 'muscleGain': return 'Prise de masse musculaire';
      case 'extremeGain': return 'Prise de masse importante';
      default: return goal;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <Header title="Mon Profil" showLogout={true} />
      
      <main className="container mx-auto px-4 py-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.div variants={itemVariants} className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Profil
            </h2>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
              >
                Modifier
              </button>
            )}
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="loading w-8 h-8"></div>
            </div>
          ) : userData ? (
            <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              {successMessage && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                  {successMessage}
                </div>
              )}
              
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                  {errorMessage}
                </div>
              )}
              
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Prénom
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={editedData?.firstName || ''}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nom
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={editedData?.lastName || ''}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editedData?.email || ''}
                      onChange={handleInputChange}
                      disabled
                      className="form-control bg-gray-50 dark:bg-gray-700"
                    />
                    <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Âge
                      </label>
                      <input
                        type="number"
                        name="age"
                        value={editedData?.age || ''}
                        onChange={handleInputChange}
                        min="1"
                        max="120"
                        className="form-control"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Poids (kg)
                      </label>
                      <input
                        type="number"
                        name="weight"
                        value={editedData?.weight || ''}
                        onChange={handleInputChange}
                        min="30"
                        max="300"
                        className="form-control"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Taille (cm)
                      </label>
                      <input
                        type="number"
                        name="height"
                        value={editedData?.height || ''}
                        onChange={handleInputChange}
                        min="100"
                        max="250"
                        className="form-control"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Genre
                      </label>
                      <select
                        name="gender"
                        value={editedData?.gender || ''}
                        onChange={handleInputChange}
                        className="form-control"
                      >
                        <option value="">Sélectionner</option>
                        <option value="male">Homme</option>
                        <option value="female">Femme</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Niveau d'activité
                      </label>
                      <select
                        name="activityLevel"
                        value={editedData?.activityLevel || ''}
                        onChange={handleInputChange}
                        className="form-control"
                      >
                        <option value="sedentary">Sédentaire (peu ou pas d'exercice)</option>
                        <option value="light">Légèrement actif (exercice léger 1-3 jours/semaine)</option>
                        <option value="moderate">Modérément actif (exercice modéré 3-5 jours/semaine)</option>
                        <option value="active">Très actif (exercice intense 6-7 jours/semaine)</option>
                        <option value="very_active">Extrêmement actif (exercice très intense)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Objectif
                      </label>
                      <select
                        name="fitnessGoal"
                        value={editedData?.fitnessGoal || 'maintenance'}
                        onChange={handleInputChange}
                        className="form-control"
                      >
                        <option value="weightLoss">Perte de poids</option>
                        <option value="maintenance">Maintien du poids</option>
                        <option value="muscleGain">Prise de masse musculaire</option>
                        <option value="extremeGain">Prise de masse importante</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Objectif calorique calculé: <span className="font-bold text-green-500">{calculateDailyCalories().toString()}</span> calories par jour
                    </p>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedData(userData);
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      disabled={isSaving}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition flex items-center"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Enregistrement...
                        </>
                      ) : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Informations personnelles</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Nom complet</span>
                          <p className="font-medium text-gray-800 dark:text-white">{userData.firstName} {userData.lastName}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
                          <p className="font-medium text-gray-800 dark:text-white">{userData.email}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Membre depuis</span>
                          <p className="font-medium text-gray-800 dark:text-white">
                            {userData.createdAt 
                              ? new Date(userData.createdAt).toLocaleDateString('fr-FR', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                }) 
                              : 'Non disponible'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Statistiques physiques</h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Âge</span>
                            <p className="font-medium text-gray-800 dark:text-white">{userData.age || '-'} ans</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Poids</span>
                            <p className="font-medium text-gray-800 dark:text-white">{userData.weight || '-'} kg</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Taille</span>
                            <p className="font-medium text-gray-800 dark:text-white">{userData.height || '-'} cm</p>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Genre</span>
                          <p className="font-medium text-gray-800 dark:text-white">
                            {userData.gender === 'male' ? 'Homme' : 
                             userData.gender === 'female' ? 'Femme' : 
                             userData.gender === 'other' ? 'Autre' : '-'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Niveau d'activité</span>
                          <p className="font-medium text-gray-800 dark:text-white">
                            {userData.activityLevel 
                              ? getActivityLevelLabel(userData.activityLevel) 
                              : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Objectif nutritionnel</h3>
                    <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Objectif calorique quotidien</span>
                        <p className="text-2xl font-bold text-green-500">{userData.dailyCaloriesGoal || '-'} calories</p>
                      </div>
                      <div className="text-5xl text-green-500">
                        🎯
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Aucune donnée de profil disponible. Remplissez votre profil en cliquant sur "Modifier".
              </p>
            </motion.div>
          )}
        </motion.div>
      </main>
      
      <Navigation />
    </div>
  );
};

export default ProfilePage;
