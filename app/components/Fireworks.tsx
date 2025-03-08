'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface FireworkParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

export default function Fireworks({ show, onComplete }: { show: boolean; onComplete: () => void }) {
  const [particles, setParticles] = useState<FireworkParticle[]>([]);
  
  // Couleurs inspirées du logo NutriTrack
  const colors = ['#4CAF50', '#8BC34A', '#FF9800', '#FF5722'];
  
  useEffect(() => {
    if (!show) return;
    
    // Créer plusieurs explosions de feux d'artifice
    const createFireworks = () => {
      const newParticles: FireworkParticle[] = [];
      
      // Créer 3 feux d'artifice à différentes positions
      for (let j = 0; j < 3; j++) {
        const centerX = Math.random() * window.innerWidth;
        const centerY = Math.random() * (window.innerHeight * 0.6);
        
        // Chaque feu d'artifice a plusieurs particules
        for (let i = 0; i < 40; i++) {
          newParticles.push({
            id: j * 100 + i,
            x: centerX,
            y: centerY,
            size: Math.random() * 5 + 2,
            color: colors[Math.floor(Math.random() * colors.length)]
          });
        }
      }
      
      setParticles(newParticles);
    };
    
    // Créer les feux d'artifice toutes les 800ms
    const interval = setInterval(createFireworks, 800);
    
    // Arrêter l'animation après 4 secondes
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setParticles([]);
      onComplete();
    }, 4000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [show, onComplete]);
  
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ 
            x: particle.x, 
            y: particle.y,
            opacity: 1
          }}
          animate={{ 
            x: particle.x + (Math.random() - 0.5) * 200, 
            y: particle.y + (Math.random() - 0.5) * 200,
            opacity: 0
          }}
          transition={{ 
            duration: 1.5,
            ease: "easeOut"
          }}
          style={{
            position: 'absolute',
            width: particle.size,
            height: particle.size,
            borderRadius: '50%',
            backgroundColor: particle.color
          }}
        />
      ))}
    </div>
  );
}
