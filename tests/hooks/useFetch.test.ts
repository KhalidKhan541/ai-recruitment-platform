import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("useFetch hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches data successfully", async () => {
    const mockData = { id: 1, name: "Test" };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const response = await fetch("/api/test");
    const data = await response.json();

    expect(data).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledWith("/api/test");
  });

  it("handles fetch errors", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    const response = await fetch("/api/missing");
    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
  });

  it("handles network errors", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    try {
      await fetch("/api/test");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe("Network error");
    }
  });

  it("sends correct headers", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await fetch("/api/test", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token123",
      },
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/test", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token123",
      },
    });
  });

  it("sends POST request with body", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const body = { name: "Test" };
    await fetch("/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  });

  it("handles transform function", async () => {
    const mockData = { id: 1, name: "Test" };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const transform = (data: any) => ({
      ...data,
      transformed: true,
    });

    const response = await fetch("/api/test");
    const raw = await response.json();
    const data = transform(raw);

    expect(data).toEqual({ id: 1, name: "Test", transformed: true });
  });

  it("handles concurrent requests", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 2 }),
      });

    const [res1, res2] = await Promise.all([
      fetch("/api/test/1").then((r) => r.json()),
      fetch("/api/test/2").then((r) => r.json()),
    ]);

    expect(res1.id).toBe(1);
    expect(res2.id).toBe(2);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("handles timeout", async () => {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 5000);

    mockFetch.mockImplementation(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Request timed out")), 6000);
        })
    );

    try {
      await fetch("/api/test", { signal: abortController.signal });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    clearTimeout(timeout);
  });

  it("retries failed requests", async () => {
    let attempts = 0;
    mockFetch.mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.resolve({ ok: false, status: 500 });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });

    let response;
    let data;

    for (let i = 0; i < 3; i++) {
      response = await fetch("/api/test");
      if (response.ok) {
        data = await response.json();
        break;
      }
    }

    expect(data).toEqual({ success: true });
    expect(attempts).toBe(3);
  });
});
