import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

describe("debounce utility", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("delays function execution", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 500);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("cancels previous calls", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 500);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("passes arguments to the function", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 500);

    debouncedFn("arg1", "arg2");
    vi.advanceTimersByTime(500);

    expect(fn).toHaveBeenCalledWith("arg1", "arg2");
  });

  it("resets delay on subsequent calls", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 500);

    debouncedFn();
    vi.advanceTimersByTime(300);
    debouncedFn();
    vi.advanceTimersByTime(300);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("executes immediately if delay is 0", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 0);

    debouncedFn();
    vi.advanceTimersByTime(0);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("handles rapid successive calls", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    for (let i = 0; i < 10; i++) {
      debouncedFn(i);
    }

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(9);
  });
});

describe("throttle utility", () => {
  function throttle<T extends (...args: any[]) => any>(
    fn: T,
    ms: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= ms) {
        lastCall = now;
        fn(...args);
      }
    };
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("executes function immediately on first call", () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 500);

    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("throttles subsequent calls within window", () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 500);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("allows calls after throttle window", () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 500);

    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(500);
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("passes arguments correctly", () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 500);

    throttledFn("test");
    vi.advanceTimersByTime(500);
    throttledFn("test2");

    expect(fn).toHaveBeenCalledWith("test");
    expect(fn).toHaveBeenCalledWith("test2");
  });
});
