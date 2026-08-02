const { readFileSync } = require('fs');

const swcJestConfig = JSON.parse(
  readFileSync(`${__dirname}/.spec.swcrc`, 'utf-8'),
);

swcJestConfig.swcrc = false;

module.exports = {
  displayName: 'appointment-service',
  preset: '../../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: {
    '^@application/(.*)$': '<rootDir>/src/appointment/application/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@domain/(.*)$': '<rootDir>/src/appointment/domain/$1',
    '^@infra/(.*)$': '<rootDir>/src/appointment/infrastructure/$1',
  },
  coverageDirectory: 'test-output/jest/coverage',
};
