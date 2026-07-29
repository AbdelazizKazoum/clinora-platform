const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      externalDependencies: [
        '@clinora/contracts-auth',
        '@clinora/contracts-clinic',
        '@clinora/contracts-patient',
        '@grpc/grpc-js',
        '@nestjs/common',
        '@nestjs/config',
        '@nestjs/core',
        '@nestjs/microservices',
        '@nestjs/passport',
        '@nestjs/platform-express',
        'class-transformer',
        'class-validator',
        'cookie-parser',
        'passport',
        'passport-jwt',
        'reflect-metadata',
        'rxjs',
        'tslib',
      ],
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
    }),
  ],
};
