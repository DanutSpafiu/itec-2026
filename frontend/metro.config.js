const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Adaugă extensia .bin la fișierele pe care Expo are voie să le citească (Obligatoriu pentru modelul nostru de AI)
config.resolver.assetExts.push('bin');

module.exports = config;
