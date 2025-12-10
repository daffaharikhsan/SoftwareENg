const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Path ke aplikasi Next.js Anda
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",

  // --- BAGIAN PENTING: MAPPING ALIAS ---
  moduleNameMapper: {
    // Memberitahu Jest bahwa @/ folder sama dengan <rootDir>/ folder
    "^@/(.*)$": "<rootDir>/$1",
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
