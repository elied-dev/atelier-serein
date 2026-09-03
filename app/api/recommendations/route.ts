const requestBody = {
  selector: { names: ["test_api_recs"] },
  context: {
    page: {
      locale: "en_US",
      type: "HOMEPAGE",
      location: "https://atelier-serein-improved.vercel.app/",
      data: [],
    },
    device: {
      userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36",
      ip: "54.100.200.255",
    },
  },
  options: { isImplicitPageview: true, returnAnalyticsMetadata: false },
};

export async function POST() {
  const apiKey = process.env.DY_API_KEY;
  if (!apiKey) {
    return Response.json({ status: "error", message: "Dynamic Yield is not configured." }, { status: 500 });
  }

  const response = await fetch("https://dy-api.com/v2/serve/user/choose", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "DY-API-Key": apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  return Response.json(await response.json(), { status: response.status });
}
