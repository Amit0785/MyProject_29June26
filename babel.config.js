module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: process.env.APP_ENV ? `.env.${process.env.APP_ENV}` : '.env',
        blocklist: null,
        allowlist: null,
        safe: false,
        allowUndefined: true,
      },
    ],
    [
      'module-resolver',
      {
        alias: {
          '@app': './src',
          '@assets': './src/assets',
          '@components': './src/components',
          '@screens': './src/screens',
          '@themes': './src/themes',
          '@types': './src/types',
          '@utils': './src/utils',
          '@store': './src/store',
        },
      },
    ],
  ],
};
