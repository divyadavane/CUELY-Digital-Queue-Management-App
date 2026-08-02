"use client";

import * as React from "react";

type Theme = "navy" | "beige";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = React.createContext<ThemeContextType>({
  theme: "beige",
  setTheme: () => null,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("navy");

  React.useEffect(() => {
    // On mount, read from localStorage or default to navy
    const savedTheme = (localStorage.getItem("cuely-theme") as Theme) || "navy";
    setThemeState(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("cuely-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return React.useContext(ThemeContext);
}
