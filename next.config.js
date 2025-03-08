/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour les images externes
  images: {
    domains: ['nix-tag-images.s3.amazonaws.com'],
  },
  
  // Désactiver la vérification ESLint pendant le build
  eslint: {
    // Ignorer les erreurs ESLint lors du build
    ignoreDuringBuilds: true,
  },
  
  // Désactiver la vérification des types TypeScript pendant le build
  typescript: {
    // Ignorer les erreurs TypeScript lors du build
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
