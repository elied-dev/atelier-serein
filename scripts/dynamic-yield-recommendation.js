(() => {
  if (window.registerWebMcpRecommendation) return;

  const controllers = new Map();

  window.registerWebMcpRecommendation = ({ name, description, selector }) => {
    const context = document.modelContext;
    if (!context) return false;

    controllers.get(name)?.abort();
    const controller = new AbortController();
    controllers.set(name, controller);

    void context.registerTool({
      name,
      description,
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: async () => {
        const response = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ selector }),
        });
        return response.json();
      },
    }, { signal: controller.signal });

    return true;
  };
})();
