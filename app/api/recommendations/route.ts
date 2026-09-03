const requestBody = (selector: string) => ({
  selector: { names: [selector] },
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
});

export async function POST(request: Request) {
  const apiKey = process.env.DY_API_KEY;
  if (!apiKey) {
    return Response.json({ status: "error", message: "Dynamic Yield is not configured." }, { status: 500 });
  }

  const selector = (await request.json().catch(() => null))?.selector;
  if (typeof selector !== "string" || !selector || selector.length > 100 || /[^A-Za-z0-9_-]/.test(selector)) {
    return Response.json({ status: "error", message: "Invalid Dynamic Yield selector." }, { status: 400 });
  }

  const response = await fetch("https://dy-api.com/v2/serve/user/choose", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "DY-API-Key": apiKey,
    },
    body: JSON.stringify(requestBody(selector)),
  });

  return Response.json(await response.json(), { status: response.status });
}
