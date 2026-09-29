export type ThemeName = "midnight" | "mint" | "paper" | "sunset";

export interface Theme {
  name: ThemeName;
  label: string;
  background: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
}

export const THEMES: Record<ThemeName, Theme> = {
  midnight: {
    name: "midnight",
    label: "미드나잇",
    background: "#0f172a",
    accent: "#6366f1",
    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
  },
  mint: {
    name: "mint",
    label: "민트",
    background: "#064e3b",
    accent: "#34d399",
    textPrimary: "#ecfdf5",
    textSecondary: "#a7f3d0",
  },
  paper: {
    name: "paper",
    label: "페이퍼",
    background: "#f5f5f4",
    accent: "#d97706",
    textPrimary: "#1c1917",
    textSecondary: "#78716c",
  },
  sunset: {
    name: "sunset",
    label: "선셋",
    background: "#7c2d12",
    accent: "#fb923c",
    textPrimary: "#fff7ed",
    textSecondary: "#fed7aa",
  },
};

export const DEFAULT_THEME: ThemeName = "midnight";

export function resolveTheme(value: string | undefined | null): Theme {
  if (value && value in THEMES) {
    return THEMES[value as ThemeName];
  }
  return THEMES[DEFAULT_THEME];
}
