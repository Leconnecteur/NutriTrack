'use client';

import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut as ReactDoughnut, Line as ReactLine } from 'react-chartjs-2';

// Composant Doughnut sécurisé
export function Doughnut({ data, options }: { data: any; options: any }) {
  // Enregistrement au niveau du composant
  if (typeof window !== 'undefined') {
    ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);
  }
  return <ReactDoughnut data={data} options={options} />;
}

// Composant Line sécurisé
export function Line({ data, options }: { data: any; options: any }) {
  // Enregistrement au niveau du composant
  if (typeof window !== 'undefined') {
    ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);
  }
  return <ReactLine data={data} options={options} />;
}

// Exportation par défaut pour l'importation dynamique
export default {
  Doughnut,
  Line
};
