import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "login-update-password.ftl" });

const meta = {
  title: "Login/Update Password",
  component: KcPageStory,
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithWarning: Story = {
  args: {
    kcContext: {
      message: {
        type: "warning",
        summary: "You need to change your password.",
      },
    },
  },
};
