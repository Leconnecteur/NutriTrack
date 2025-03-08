'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaGoogle } from 'react-icons/fa';
import Fireworks from '../../components/Fireworks';

// Types pour le formulaire d'inscription
interface UserData {
  firstName: string;
  lastName: string;
  age: string;
  weight: string;
  height: string;
  activityLevel: string;
  email: string;
  password: string;
  gender: string;
  fitnessGoal: string;
}

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

export default function Register() {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<UserData>({
    firstName: '',
    lastName: '',
    age: '',
    weight: '',
    height: '',
    activityLevel: 'moderate',
    email: '',
    password: '',
    gender: '',
    fitnessGoal: 'maintenance',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFireworks, setShowFireworks] = useState(false);
  const router = useRouter();

  // Fonction pour calculer les calories journalières recommandées
  const calculateDailyCalories = () => {
    // Harris-Benedict formula with activity multiplier
    let bmr = 0;
    
    if (userData.gender === 'male') {
      bmr = 88.362 + (13.397 * userData.weight) + (4.799 * userData.height) - (5.677 * userData.age);
    } else if (userData.gender === 'female') {
      bmr = 447.593 + (9.247 * userData.weight) + (3.098 * userData.height) - (4.330 * userData.age);
    } else {
      // Non-binary or unspecified - average of male and female formula
      const maleBmr = 88.362 + (13.397 * userData.weight) + (4.799 * userData.height) - (5.677 * userData.age);
      const femaleBmr = 447.593 + (9.247 * userData.weight) + (3.098 * userData.height) - (4.330 * userData.age);
      bmr = (maleBmr + femaleBmr) / 2;
    }
    
    // Apply activity multiplier
    let activityMultiplier = 1.2; // Default: sedentary
    
    switch (userData.activityLevel) {
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
      case 'veryActive':
        activityMultiplier = 1.9;
        break;
    }
    
    // Appliquer le facteur d'objectif
    const goalFactor = fitnessGoals.find(goal => goal.id === userData.fitnessGoal)?.factor || 1.0;
    
    return Math.round((bmr * activityMultiplier) * goalFactor);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    
    try {
      console.log("Début d'inscription avec email:", userData.email);
      
      // Créer l'utilisateur avec Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      console.log("Utilisateur créé:", userCredential.user.uid);
      
      // Calculer les calories journalières recommandées
      const dailyCalories = calculateDailyCalories();
      
      // Ajouter les informations de l'utilisateur à Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        firstName: userData.firstName,
        lastName: userData.lastName,
        age: parseInt(userData.age) || 0,
        weight: parseFloat(userData.weight) || 0,
        height: parseFloat(userData.height) || 0,
        activityLevel: userData.activityLevel,
        fitnessGoal: userData.fitnessGoal,
        email: userData.email,
        dailyCaloriesGoal: dailyCalories,
        createdAt: new Date().toISOString()
      });
      
      console.log("Données utilisateur enregistrées dans Firestore");
      
      // Afficher les feux d'artifice
      setShowFireworks(true);
      
      // Après l'animation, rediriger vers le dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 4000);
      
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      
      // Afficher une erreur plus spécifique en fonction du code d'erreur
      if (error.code === 'auth/email-already-in-use') {
        setError('Cette adresse email est déjà utilisée.');
      } else if (error.code === 'auth/invalid-email') {
        setError('L\'adresse email n\'est pas valide.');
      } else if (error.code === 'auth/weak-password') {
        setError('Le mot de passe est trop faible (minimum 6 caractères).');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Problème de connexion réseau. Vérifiez votre connexion internet.');
      } else {
        setError(`Une erreur est survenue lors de l'inscription: ${error.message}`);
      }
      
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        router.push('/auth/complete-profile');
      }
    } catch (error) {
      console.error("Erreur d'inscription avec Google:", error);
      setError("Échec de l'inscription avec Google. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 overflow-y-auto max-h-[90vh]">
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
            <h1 className="mt-6 text-2xl font-bold text-gray-800 dark:text-white">Créer un compte</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              {step === 1 ? 'Commençons par quelques informations de base' : 'Finalisez votre inscription'}
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

          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prénom
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={userData.firstName}
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
                    value={userData.lastName}
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
                  value={userData.age}
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
                    value={userData.weight}
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
                    value={userData.height}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
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
                  value={userData.activityLevel}
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
                  value={userData.fitnessGoal}
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

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sexe
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={userData.gender}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Sélectionnez votre sexe</option>
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  Continuer
                </motion.button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={userData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={userData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="••••••••"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Le mot de passe doit contenir au moins 6 caractères
                </p>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300"
                >
                  Retour
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Inscription en cours...' : 'S\'inscrire'}
                </motion.button>
              </div>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Ou</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-4 w-full py-3 px-4 flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <FaGoogle className="text-orange-500" />
              <span>Continuer avec Google</span>
            </motion.button>
          </div>

          <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Vous avez déjà un compte ?{' '}
            <Link href="/auth/login" className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-medium">
              Se connecter
            </Link>
          </div>
        </div>
      </motion.div>
      
      {/* Composant de feux d'artifice */}
      <Fireworks 
        show={showFireworks} 
        onComplete={() => {
          setShowFireworks(false);
          router.push('/dashboard');
        }} 
      />
    </div>
  );
}
