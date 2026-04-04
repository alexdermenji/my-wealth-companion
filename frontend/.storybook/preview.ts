import type { Preview } from "@storybook/react";
import "../src/index.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "pearl",
      values: [
        { name: "pearl", value: "#f0f2f8" },
        { name: "white", value: "#ffffff" },
        { name: "dark",  value: "#0d0f14" },
      ],
    },
    docs: {
      toc: true,
    },
    layout: "padded",
  },
};

export default preview;
