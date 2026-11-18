export default new Proxy(
  {},
  {
    get: (_target, name) => {
      if (name === "__esModule") return true;
      if (name === "default") return "icon";
      return () => <svg data-testid={`icon-${String(name)}`} />;
    },
  },
);
