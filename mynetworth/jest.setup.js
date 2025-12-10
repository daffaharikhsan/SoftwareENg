// jest.setup.js
import "@testing-library/jest-dom";

// Polyfill untuk ResizeObserver (Dibutuhkan oleh Recharts)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
