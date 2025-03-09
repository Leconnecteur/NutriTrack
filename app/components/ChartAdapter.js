'use client';

import { createDoughnutChart, createLineChart } from './SimpleCharts';

// Composant qui simule l'interface de Chart.js pour une transition en douceur
export function DoughnutChart({ data, options }) {
  // Utilisation d'une référence au lieu d'un hook
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      const containerId = 'doughnut-' + Math.random().toString(36).substring(2, 9);
      document.currentScript.parentElement.id = containerId;
      
      // Adaptation des données au format de notre implémentation simple
      const percentage = data.datasets[0].data[0] / (data.datasets[0].data.reduce((a, b) => a + b, 0)) * 100;
      createDoughnutChart(containerId, percentage, data.datasets[0].backgroundColor[0]);
    }, 0);
  }
  
  return null;
}

export function LineChart({ data, options }) {
  // Utilisation d'une référence au lieu d'un hook
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      const containerId = 'line-' + Math.random().toString(36).substring(2, 9);
      document.currentScript.parentElement.id = containerId;
      
      // Adaptation des données au format de notre implémentation simple
      const chartData = data.labels.map((label, index) => ({
        label: label,
        value: data.datasets[0].data[index]
      }));
      
      createLineChart(containerId, chartData, data.datasets[0].label || 'Données');
    }, 0);
  }
  
  return null;
}

export function BarChart({ data, options }) {
  // Pour l'instant, on réutilise l'implémentation du graphique linéaire
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      const containerId = 'bar-' + Math.random().toString(36).substring(2, 9);
      document.currentScript.parentElement.id = containerId;
      
      // Adaptation des données au format de notre implémentation simple
      const chartData = data.labels.map((label, index) => ({
        label: label,
        value: data.datasets[0].data[index]
      }));
      
      createLineChart(containerId, chartData, data.datasets[0].label || 'Données');
    }, 0);
  }
  
  return null;
}

export default {
  Doughnut: DoughnutChart,
  Line: LineChart,
  Bar: BarChart
};
