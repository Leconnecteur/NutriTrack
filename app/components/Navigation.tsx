'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FaHome, FaUtensils, FaChartLine, FaUser } from 'react-icons/fa';

const Navigation = () => {
  const pathname = usePathname();

  // Navigation items
  const navItems = [
    { 
      name: 'Accueil', 
      path: '/dashboard', 
      icon: <FaHome className="w-6 h-6" /> 
    },
    { 
      name: 'Repas', 
      path: '/meals', 
      icon: <FaUtensils className="w-6 h-6" /> 
    },
    { 
      name: 'Statistiques', 
      path: '/stats', 
      icon: <FaChartLine className="w-6 h-6" /> 
    },
    { 
      name: 'Profil', 
      path: '/profile', 
      icon: <FaUser className="w-6 h-6" /> 
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-up">
      <div className="container mx-auto max-w-md">
        <div className="flex justify-between items-center">
          {navItems.map((item) => (
            <Link 
              href={item.path} 
              key={item.path}
              className={`flex flex-col items-center justify-center p-4 w-full ${
                pathname === item.path 
                  ? 'text-green-500 dark:text-green-400 border-t-2 border-green-500'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
