export const colors = {
  background: "#101312",
  surface: "#181e1b",
  surfaceElevated: "#202824",
  textPrimary: "#f0f3f0",
  textSecondary: "#9ba79f",
  accent: "#8dbb9a",
  accentStrong: "#6ca77d",
  border: "#2b342e",
  danger: "#d97979",
  warning: "#d9b875",
} as const;

export const brand = {
  name: "System",
  tagline: "Your day. Under control.",
  /** Logo asset pending — use text wordmark until original is supplied. */
  logoStatus: "missing" as const,
};

export type ColorToken = keyof typeof colors;
