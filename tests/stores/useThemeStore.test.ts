import { describe, it, expect, vi, beforeEach } from "vitest";

type Theme = "light" | "dark" | "system";

interface ThemeStore {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  getSystemPreference: () => "light" | "dark";
}

function createThemeStore(): ThemeStore {
  let theme: Theme = "system";

  const getSystemPreference = (): "light" | "dark" => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  };

  const getResolvedTheme = (): "light" | "dark" => {
    if (theme === "system") return getSystemPreference();
    return theme;
  };

  return {
    get theme() { return theme; },
    get resolvedTheme() { return getResolvedTheme(); },

    setTheme: (newTheme: Theme) => {
      theme = newTheme;
    },

    toggleTheme: () => {
      const resolved = getResolvedTheme();
      theme = resolved === "light" ? "dark" : "light";
    },

    getSystemPreference,
  };
}

describe("useThemeStore", () => {
  let store: ThemeStore;

  beforeEach(() => {
    store = createThemeStore();
  });

  it("defaults to system theme", () => {
    expect(store.theme).toBe("system");
  });

  it("sets theme to light", () => {
    store.setTheme("light");
    expect(store.theme).toBe("light");
  });

  it("sets theme to dark", () => {
    store.setTheme("dark");
    expect(store.theme).toBe("dark");
  });

  it("sets theme to system", () => {
    store.setTheme("light");
    store.setTheme("system");
    expect(store.theme).toBe("system");
  });

  it("toggles from light to dark", () => {
    store.setTheme("light");
    store.toggleTheme();
    expect(store.theme).toBe("dark");
  });

  it("toggles from dark to light", () => {
    store.setTheme("dark");
    store.toggleTheme();
    expect(store.theme).toBe("light");
  });
});

describe("Theme CSS application", () => {
  it("applies dark class to html element", () => {
    const applyTheme = (theme: "light" | "dark") => {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(theme);
    };

    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    applyTheme("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("sets CSS variables for theme colors", () => {
    const themeColors = {
      light: {
        bg: "#ffffff",
        text: "#000000",
        primary: "#3b82f6",
      },
      dark: {
        bg: "#0f172a",
        text: "#f8fafc",
        primary: "#60a5fa",
      },
    };

    const setThemeColors = (theme: "light" | "dark") => {
      const colors = themeColors[theme];
      document.documentElement.style.setProperty("--bg-color", colors.bg);
      document.documentElement.style.setProperty("--text-color", colors.text);
      document.documentElement.style.setProperty("--primary-color", colors.primary);
    };

    setThemeColors("dark");
    expect(document.documentElement.style.getPropertyValue("--bg-color")).toBe("#0f172a");

    setThemeColors("light");
    expect(document.documentElement.style.getPropertyValue("--bg-color")).toBe("#ffffff");
  });
});

describe("Theme persistence", () => {
  it("saves theme preference to localStorage", () => {
    const saveTheme = (theme: Theme) => {
      localStorage.setItem("theme-preference", theme);
    };

    saveTheme("dark");
    expect(localStorage.getItem("theme-preference")).toBe("dark");
  });

  it("loads theme preference from localStorage", () => {
    localStorage.setItem("theme-preference", "light");

    const loadTheme = (): Theme => {
      return (localStorage.getItem("theme-preference") as Theme) || "system";
    };

    expect(loadTheme()).toBe("light");
  });

  it("returns system when no preference saved", () => {
    const loadTheme = (): Theme => {
      return (localStorage.getItem("theme-preference") as Theme) || "system";
    };

    expect(loadTheme()).toBe("system");
  });
});

describe("System preference detection", () => {
  it("detects dark mode preference", () => {
    const mockMatchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    vi.stubGlobal("matchMedia", mockMatchMedia);

    const getSystemPreference = (): "light" | "dark" => {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    };

    expect(getSystemPreference()).toBe("dark");
  });

  it("detects light mode preference", () => {
    const mockMatchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    vi.stubGlobal("matchMedia", mockMatchMedia);

    const getSystemPreference = (): "light" | "dark" => {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    };

    expect(getSystemPreference()).toBe("light");
  });
});
