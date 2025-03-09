'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Vérifier l'état d'authentification uniquement côté client
    if (typeof window !== 'undefined') {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          // Si l'utilisateur est connecté, rediriger vers le dashboard
          console.log('Utilisateur déjà connecté, redirection vers le dashboard');
          router.replace('/dashboard');
        } else {
          console.log('Aucun utilisateur connecté, restant sur la page d\'accueil');
        }
      });

      // Nettoyer la souscription lors du démontage du composant
      return () => unsubscribe();
    }
  }, [router]);

  // Ce composant ne rend rien visuellement
  return null;
}
