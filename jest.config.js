export default {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.cjs"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^lucide-react$": "<rootDir>/src/test/mocks/lucideReact.jsx",
  },
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!axios|lucide-react|react-router|@testing-library)/",
  ],
  testMatch: ["<rootDir>/src/**/*.test.js?(x)"],
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/main.jsx",
    "!src/App.jsx",
    "!src/**/*.css",
    "!src/test/**",
  ],
};
