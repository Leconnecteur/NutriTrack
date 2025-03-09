'use client';

import { useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut as ReactDoughnut, Line as ReactLine } from 'react-chartjs-2';

// Enregistrer les composants Chart.js au chargement
if (typeof window !== 'undefined') {
  ChartJS.register(
    ArcElement, 
    Tooltip, 
    Legend, 
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    Title
  );
}

// Composant Doughnut sécurisé
export function Doughnut({ data, options }: { data: any; options: any }) {
  return <ReactDoughnut data={data} options={options} />;
}

// Composant Line sécurisé
export function Line({ data, options }: { data: any; options: any }) {
  return <ReactLine data={data} options={options} />;
}

// Exportation par défaut pour l'importation dynamique
export default {
  Doughnut,
  Line
};
