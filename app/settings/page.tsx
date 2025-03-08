'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Navigation from '../components/Navigation';

interface UserProfile {
  firstName: string;
  lastName: string;
  age: number;
  weight: number;
  height: number;
  activityLevel: string;
  dailyCaloriesGoal: number;
}

const activityLevels = [
  { id: 'sedentary', label: 'Sédentaire (peu ou pas d\'exercice)', factor: 1.2 },
  { id: 'light', label: 'Légèrement actif (exercice léger 1-3 jours/semaine)', factor: 1.375 },
  { id: 'moderate', label: 'Modérément actif (exercice modéré 3-5 jours/semaine)', factor: 1.55 },
  { id: 'active', label: 'Très actif (exercice intense 6-7 jours/semaine)', factor: 1.725 },
  { id: 'veryActive', label: 'Extrêmement actif (exercice très intense, travail physique)', factor: 1.9 },
];

export default function Settings() {
  const [user, loading] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    age: 30,
    weight: 70,
    height: 170,
    activityLevel: 'moderate',
    dailyCaloriesGoal: 2000
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    const fetchUserProfile = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          }
        } catch (error) {
          console.error('Erreur lors du chargement du profil :', error);
          setError('Impossible de charger votre profil. Veuillez réessayer plus tard.');
        }
      }
    };

    fetchUserProfile();
  }, [user, loading, router]);

  const calculateDailyCalories = () => {
    const age = parseInt(profile.age.toString());
    const weight = parseInt(profile.weight.toString());
    const height = parseInt(profile.height.toString());
    const activityFactor = activityLevels.find(level => level.id === profile.activityLevel)?.factor || 1.55;
    
    // Formule pour les hommes (par défaut)
    let bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    
    return Math.round(bmr * activityFactor);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ 
      ...prev, 
      [name]: name === 'age' || name === 'weight' || name === 'height' 
        ? parseInt(value) 
        : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      // Calculer les calories journalières recommandées
      const dailyCalories = calculateDailyCalories();

      // Mettre à jour le profil dans Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        firstName: profile.firstName,
        lastName: profile.lastName,
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        activityLevel: profile.activityLevel,
        dailyCaloriesGoal: dailyCalories,
      });

      // Mettre à jour le nom d'affichage dans Firebase Auth
      await updateProfile(user, {
        displayName: `${profile.firstName} ${profile.lastName}`,
      });

      setSuccessMessage('Profil mis à jour avec succès !');
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error);
      setError('Une erreur est survenue lors de la mise à jour de votre profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
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
      <Header title="Paramètres" showLogout={false} />
      
      <main className="container mx-auto px-4 py-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Paramètres de votre compte
            </h2>
          </motion.div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}

          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm"
            >
              {successMessage}
            </motion.div>
          )}

          <motion.div 
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
          >
            <div className="border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  Informations du profil
                </h3>
                {!isEditing && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Modifier
                  </motion.button>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6">
                {/* Mode édition */}
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Prénom
                        </label>
                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          value={profile.firstName}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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
                          value={profile.lastName}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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
                        value={profile.age}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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
                          value={profile.weight}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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
                          value={profile.height}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="activityLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Niveau d'activité
                      </label>
                      <select
                        id="activityLevel"
                        name="activityLevel"
                        value={profile.activityLevel}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        {activityLevels.map(level => (
                          <option key={level.id} value={level.id}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Annuler
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-70"
                      >
                        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                      </motion.button>
                    </div>
                  </>
                ) : (
                  /* Mode affichage */
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Prénom</h4>
                        <p className="mt-1 text-gray-900 dark:text-white">{profile.firstName}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Nom</h4>
                        <p className="mt-1 text-gray-900 dark:text-white">{profile.lastName}</p>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Âge</h4>
                      <p className="mt-1 text-gray-900 dark:text-white">{profile.age} ans</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Poids</h4>
                        <p className="mt-1 text-gray-900 dark:text-white">{profile.weight} kg</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Taille</h4>
                        <p className="mt-1 text-gray-900 dark:text-white">{profile.height} cm</p>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Niveau d'activité</h4>
                      <p className="mt-1 text-gray-900 dark:text-white">
                        {activityLevels.find(level => level.id === profile.activityLevel)?.label || 'Non défini'}
                      </p>
                    </div>
                    
                    <div className="pt-2">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Objectif calorique quotidien</h4>
                      <p className="mt-1 text-gray-900 dark:text-white font-semibold">{profile.dailyCaloriesGoal} kcal</p>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
          >
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
              Compte et sécurité
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h4>
                <p className="mt-1 text-gray-900 dark:text-white">{user?.email}</p>
              </div>
              
              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                >
                  Se déconnecter
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
      
      <Navigation />
    </div>
  );
}
