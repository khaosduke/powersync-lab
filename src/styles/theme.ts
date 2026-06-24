// theme.ts
export const colors = {
  bgTop: "#061426",
  bgMid: "#062B4A",
  bgBottom: "#020814",

  cyan: "#15D7E6",
  blue: "#1597F5",
  blueDeep: "#0877E8",

  textPrimary: "#FFFFFF",
  textSecondary: "#B8C4D9",
  textMuted: "#7F8CA3",

  border: "rgba(184, 196, 217, 0.22)",
  inputBg: "rgba(2, 8, 20, 0.25)",
  cardBg: "rgba(4, 18, 34, 0.55)",

  shadow: "#000000",
};

export const gradients = {
  background: [colors.bgTop, colors.bgMid, colors.bgBottom],
  primaryButton: [colors.blueDeep, colors.cyan],
  logo: [colors.blue, colors.cyan],
};

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 36,
  xxl: 56,
};