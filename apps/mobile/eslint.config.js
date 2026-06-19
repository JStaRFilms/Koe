const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  {
    ignores: [
      '.expo/**',
      '.expo-export/**',
      '.expo-export-stop-fix/**',
      'dist/**',
      'node_modules/**',
    ],
  },
  ...expoConfig,
  {
    files: ['app/index.tsx', 'src/components/StatusCard.tsx'],
    rules: {
      // These files intentionally synchronize async account data / timed animations from effects.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);
