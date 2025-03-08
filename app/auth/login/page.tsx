'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaGoogle } from 'react-icons/fa';
import Image from 'next/image';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    
    try {
      console.log("Tentative de connexion avec email:", email);
      
      // Se connecter avec Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Connexion réussie pour l'utilisateur:", userCredential.user.uid);
      
      // Rediriger vers le tableau de bord
      router.push('/dashboard');
    } catch (error) {
      console.error("Erreur de connexion:", error);
      
      // Afficher une erreur plus spécifique en fonction du code d'erreur
      if (error.code === 'auth/invalid-email') {
        setError('L\'adresse email n\'est pas valide.');
      } else if (error.code === 'auth/user-not-found') {
        setError('Aucun compte avec cette adresse email n\'a été trouvé.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Mot de passe incorrect.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Trop de tentatives de connexion infructueuses. Veuillez réessayer plus tard.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Problème de connexion réseau. Vérifiez votre connexion internet.');
      } else {
        setError(`Échec de la connexion: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Erreur de connexion avec Google:", error);
      setError('Échec de la connexion avec Google. Veuillez réessayer.');
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
            <h1 className="mt-6 text-2xl font-bold text-gray-800 dark:text-white">Connexion</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Heureux de vous revoir !
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mot de passe
                </label>
                <Link 
                  href="/auth/reset-password" 
                  className="text-xs text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="••••••••"
              />
            </div>

            <div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </motion.button>
            </div>
          </form>

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
            Vous n'avez pas de compte ?{' '}
            <Link href="/auth/register" className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-medium">
              S'inscrire
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
