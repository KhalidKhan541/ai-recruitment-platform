import { afterEach, vi } from "vitest";

class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }
}

const mockLocalStorage = new MockLocalStorage();

vi.stubGlobal("localStorage", mockLocalStorage);
vi.stubGlobal("fetch", vi.fn());

afterEach(() => {
  vi.clearAllMocks();
  mockLocalStorage.clear();
});

export { mockLocalStorage };
