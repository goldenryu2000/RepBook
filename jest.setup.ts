/**
 * jest.setup.ts
 * Global jest setup – mocks out native modules that can't run in a Node.js environment.
 */

// expo-sqlite uses native JSI – mock the entire module
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

// Silence the "act()" warning noise from older React versions in tests
global.IS_REACT_ACT_ENVIRONMENT = true;
