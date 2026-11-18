require("@testing-library/jest-dom");

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    _store: () => store,
  };
})();

Object.defineProperty(globalThis.window, "localStorage", {
  value: localStorageMock,
  configurable: true,
});

globalThis.MouseEvent = globalThis.window.MouseEvent;
globalThis.KeyboardEvent = globalThis.window.KeyboardEvent;
globalThis.Event = globalThis.window.Event;

afterEach(() => {
  localStorageMock.clear();
});
