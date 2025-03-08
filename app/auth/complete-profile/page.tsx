'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

// Niveaux d'activité et leurs facteurs multiplicateurs pour le calcul des calories
const activityLevels = [
  { id: 'sedentary', label: 'Sédentaire (peu ou pas d\'exercice)', factor: 1.2 },
  { id: 'light', label: 'Légèrement actif (exercice léger 1-3 jours/semaine)', factor: 1.375 },
  { id: 'moderate', label: 'Modérément actif (exercice modéré 3-5 jours/semaine)', factor: 1.55 },
  { id: 'active', label: 'Très actif (exercice intense 6-7 jours/semaine)', factor: 1.725 },
  { id: 'veryActive', label: 'Extrêmement actif (exercice très intense, travail physique)', factor: 1.9 },
];

// Objectifs et leurs facteurs multiplicateurs pour le calcul des calories
const fitnessGoals = [
  { id: 'weightLoss', label: 'Perte de poids', factor: 0.8 }, // Déficit calorique de 20%
  { id: 'maintenance', label: 'Maintien du poids', factor: 1.0 }, // Maintenance
  { id: 'muscleGain', label: 'Prise de masse musculaire', factor: 1.1 }, // Surplus de 10%
  { id: 'extremeGain', label: 'Prise de masse importante', factor: 1.2 }, // Surplus de 20%
];

export default function CompleteProfile() {
  const [user, loading] = useAuthState(auth);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    weight: '',
    height: '',
    gender: 'male',
    activityLevel: 'moderate',
    fitnessGoal: 'maintenance'
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
    else if (user) {
      const displayName = user.displayName || '';
      const nameParts = displayName.split(' ');
      
      setProfileData(prev => ({
        ...prev,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
      }));
    }
  }, [user, loading, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fonction pour calculer les besoins caloriques quotidiens (formule de Harris-Benedict avec ajustement selon l'objectif)
  const calculateDailyCalories = () => {
    const weight = parseFloat(profileData.weight);
    const height = parseFloat(profileData.height);
    const age = parseInt(profileData.age);
    const activityFactor = activityLevels.find(level => level.id === profileData.activityLevel)?.factor || 1.55;
    const goalFactor = fitnessGoals.find(goal => goal.id === profileData.fitnessGoal)?.factor || 1.0;
    
    let bmr;
    if (profileData.gender === 'male') {
      // Formule pour hommes
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      // Formule pour femmes
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
    
    // Multiplier par le facteur d'activité, puis par le facteur d'objectif
    return Math.round((bmr * activityFactor) * goalFactor);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('Vous devez être connecté pour compléter votre profil');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Calculer les besoins caloriques quotidiens
      const dailyCaloriesGoal = calculateDailyCalories();

      // Stocker les informations du profil dans Firestore
      await setDoc(doc(db, 'users', user.uid), {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        age: parseInt(profileData.age),
        weight: parseFloat(profileData.weight),
        height: parseFloat(profileData.height),
        gender: profileData.gender,
        activityLevel: profileData.activityLevel,
        fitnessGoal: profileData.fitnessGoal,
        dailyCaloriesGoal,
        email: user.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Rediriger vers le tableau de bord
      router.push('/dashboard');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error);
      setError('Une erreur est survenue lors de la sauvegarde de votre profil');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <Image 
                src="/logonutrissfond.png" 
                alt="NutriTrack Logo" 
                width={120} 
                height={120}
                className="rounded-full shadow-md"
                priority
              />
            </Link>
            <h1 className="mt-6 text-2xl font-bold text-gray-800 dark:text-white">Compléter votre profil</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Ces informations nous aideront à personnaliser votre expérience
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prénom
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={profileData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={profileData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Âge
              </label>
              <input
                id="age"
                name="age"
                type="number"
                min="15"
                max="120"
                value={profileData.age}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Poids (kg)
                </label>
                <input
                  id="weight"
                  name="weight"
                  type="number"
                  min="30"
                  max="300"
                  value={profileData.weight}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Taille (cm)
                </label>
                <input
                  id="height"
                  name="height"
                  type="number"
                  min="100"
                  max="250"
                  value={profileData.height}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sexe
              </label>
              <select
                id="gender"
                name="gender"
                value={profileData.gender}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="male">Homme</option>
                <option value="female">Femme</option>
              </select>
            </div>

            <div>
              <label htmlFor="activityLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Niveau d'activité
              </label>
              <select
                id="activityLevel"
                name="activityLevel"
                value={profileData.activityLevel}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              >
                {activityLevels.map(level => (
                  <option key={level.id} value={level.id}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="fitnessGoal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Objectif
              </label>
              <select
                id="fitnessGoal"
                name="fitnessGoal"
                value={profileData.fitnessGoal}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              >
                {fitnessGoals.map(goal => (
                  <option key={goal.id} value={goal.id}>
                    {goal.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer et continuer'}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
