import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion } from 'framer-motion';

interface HeaderProps {
  title?: string;
  showLogout?: boolean;
  backUrl?: string;
}

const Header = ({ title, showLogout = false, backUrl }: HeaderProps) => {
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      console.log("Déconnexion en cours...");
      await signOut(auth);
      console.log("Déconnexion réussie");
      router.push('/auth/login');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };
  
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {backUrl && (
            <Link 
              href={backUrl}
              className="mr-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          )}
          
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logonutrissfond.png"
              alt="NutriTrack Logo"
              width={80}
              height={80}
              className="rounded-lg"
            />
          </Link>
          
          {title && (
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              {title}
            </h1>
          )}
        </div>
        
        {showLogout && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <span className="sr-only">Déconnexion</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </motion.button>
        )}
      </div>
    </header>
  );
};

export default Header;
