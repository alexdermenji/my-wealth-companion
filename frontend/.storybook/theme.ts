import { create } from "@storybook/theming/create";

export default create({
  base: "light",

  brandTitle: "FinanceFlow · Pearl Design System",
  brandUrl: "/",
  brandTarget: "_self",

  // App chrome
  appBg: "#f0f2f8",
  appContentBg: "#ffffff",
  appPreviewBg: "#f0f2f8",
  appBorderColor: "#dde3f0",
  appBorderRadius: 10,

  // Text
  textColor: "#1a1f35",
  textMutedColor: "#7a849e",
  textInverseColor: "#ffffff",

  // Toolbar
  barTextColor: "#7a849e",
  barSelectedColor: "#6c5ce7",
  barHoverColor: "#1a1f35",
  barBg: "#ffffff",

  // Form elements
  inputBg: "#ffffff",
  inputBorder: "#dde3f0",
  inputTextColor: "#1a1f35",
  inputBorderRadius: 6,

  // Brand colors
  colorPrimary: "#6c5ce7",
  colorSecondary: "#6c5ce7",

  // Typography
  fontBase: '"DM Sans", system-ui, sans-serif',
  fontCode: '"Fira Code", "Cascadia Code", monospace',
});
