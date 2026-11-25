const nextJest = require("next/jest")

const createJestConfig = nextJest({
  // مسيری که Next.js در آن قرار دارد تا فایل‌های .env و next.config.js را بخواند
  dir: "./",
})

// کانفیگ‌های شخصی‌سازی شده Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    // برای پشتیبانی از alias های تایپ‌اسکریپت مثل @/components
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@lib/(.*)$": "<rootDir>/src/lib/$1",
    "^@modules/(.*)$": "<rootDir>/src/modules/$1",
    "^@pages/(.*)$": "<rootDir>/src/pages/$1",
  },
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.next/",
    "<rootDir>/e2e/",
  ],
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
}

module.exports = createJestConfig(customJestConfig)
