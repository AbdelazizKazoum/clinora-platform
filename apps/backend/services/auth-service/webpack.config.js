const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join, resolve } = require('path');

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
        '@grpc/grpc-js',
        '@nestjs/common',
        '@nestjs/config',
        '@nestjs/core',
        '@nestjs/jwt',
        '@nestjs/microservices',
        '@nestjs/platform-express',
        '@nestjs/typeorm',
        'bcryptjs',
        'class-transformer',
        'class-validator',
        'mysql2',
        'reflect-metadata',
        'rxjs',
        'tslib',
        'typeorm',
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
  resolve: {
    alias: {
      '@application': resolve(__dirname, 'src/auth/application'),
      '@common': resolve(__dirname, 'src/common'),
      '@domain': resolve(__dirname, 'src/auth/domain'),
      '@infra': resolve(__dirname, 'src/auth/infrastructure'),
    },
  },
};
