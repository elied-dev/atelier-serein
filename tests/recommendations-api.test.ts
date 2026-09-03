import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/recommendations/route";

describe("recommendations API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("rejects requests when the server API key is missing", async () => {
    vi.stubEnv("DY_API_KEY", "");
    vi.stubGlobal("fetch", async () => { throw new Error("Upstream must not be called"); });

    const response = await POST();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ status: "error", message: "Dynamic Yield is not configured." });
  });

  it("keeps the API key server-side and forwards the recommendation request", async () => {
    vi.stubEnv("DY_API_KEY", "server-secret");
    let upstreamRequest: Request | undefined;
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      upstreamRequest = new Request(input, init);
      return Response.json({ choices: [{ name: "test_api_recs" }] });
    });

    const response = await POST();
    const body = await response.json();
    const upstreamBody = await upstreamRequest?.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ choices: [{ name: "test_api_recs" }] });
    expect(upstreamRequest?.url).toBe("https://dy-api.com/v2/serve/user/choose");
    expect(upstreamRequest?.method).toBe("POST");
    expect(upstreamRequest?.headers.get("DY-API-Key")).toBe("server-secret");
    expect(upstreamBody).toEqual({
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
    });
  });
});
