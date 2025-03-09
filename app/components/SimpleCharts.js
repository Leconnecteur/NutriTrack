'use client';

import { useEffect, useRef } from 'react';

// Fonction pour créer un graphique circulaire simple avec le pourcentage au centre
export function createDoughnutChart(containerId, percentage, color = '#3b82f6') {
  // S'assurer que nous sommes côté client
  if (typeof window === 'undefined') return;

  const container = document.getElementById(containerId);
  if (!container) return;

  // Effacer le contenu précédent
  container.innerHTML = '';
  
  // Créer un élément canvas
  const canvas = document.createElement('canvas');
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Dessiner le fond
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 10, 0, Math.PI * 2);
  ctx.fillStyle = '#f3f4f6';
  ctx.fill();
  
  // Dessiner la progression
  const angleToFill = (percentage / 100) * Math.PI * 2;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, canvas.height / 2);
  ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 10, -Math.PI / 2, angleToFill - Math.PI / 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  
  // Dessiner le cercle intérieur (trou)
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 3, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

// Fonction pour créer un graphique linéaire simple 
export function createLineChart(containerId, data, label) {
  // S'assurer que nous sommes côté client
  if (typeof window === 'undefined') return;

  const container = document.getElementById(containerId);
  if (!container) return;

  // Effacer le contenu précédent
  container.innerHTML = '';
  
  // Créer un élément canvas
  const canvas = document.createElement('canvas');
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Paramètres et calculs pour le graphique
  const padding = 30;
  const chartWidth = canvas.width - (padding * 2);
  const chartHeight = canvas.height - (padding * 2);
  
  // Trouver les valeurs min et max
  const values = data.map(item => item.value);
  const maxValue = Math.max(...values) * 1.1; // 10% de marge
  const minValue = Math.min(...values) * 0.9; // 10% de marge
  
  // Dessiner l'axe X et Y
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  
  // Axe Y
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.stroke();
  
  // Axe X
  ctx.beginPath();
  ctx.moveTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();
  
  // Dessiner les points et les lignes
  const pointRadius = 4;
  
  // Calculer les coordonnées de chaque point
  const points = data.map((item, index) => {
    const x = padding + (index * (chartWidth / (data.length - 1)));
    const y = canvas.height - padding - ((item.value - minValue) / (maxValue - minValue) * chartHeight);
    return { x, y, label: item.label, value: item.value };
  });
  
  // Dessiner les lignes entre les points
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();
  
  // Dessiner les points
  points.forEach(point => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, pointRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Ajouter les étiquettes sur l'axe X
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(point.label, point.x, canvas.height - padding + 15);
    
    // Ajouter la valeur près du point
    ctx.fillStyle = '#3b82f6';
    ctx.fillText(point.value.toString(), point.x, point.y - 10);
  });
}

// Hook pour créer un graphique circulaire
export function useDoughnutChart(containerId, percentage, color) {
  useEffect(() => {
    // Petit délai pour s'assurer que le DOM est prêt
    const timer = setTimeout(() => {
      createDoughnutChart(containerId, percentage, color);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [containerId, percentage, color]);
}

// Hook pour créer un graphique linéaire
export function useLineChart(containerId, data, label) {
  useEffect(() => {
    // Petit délai pour s'assurer que le DOM est prêt
    const timer = setTimeout(() => {
      createLineChart(containerId, data, label);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [containerId, data, label]);
}

export default {
  useDoughnutChart,
  useLineChart,
  createDoughnutChart,
  createLineChart
};
