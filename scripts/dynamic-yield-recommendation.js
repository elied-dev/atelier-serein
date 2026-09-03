(() => {
  const registerWebMcpRecommendation = () => window.webMcp?.registerRecommendation({
    name: "recommendation",
    description: "Call this tool first when the shopper asks to buy, choose, discover, or get product recommendations.",
    selector: "test_api_recs",
  });

  if (!registerWebMcpRecommendation()) {
    window.addEventListener("webmcp:ready", registerWebMcpRecommendation, { once: true });
  }
})();
