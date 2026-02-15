import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "login.ftl" });

const meta = {
  title: "Login/Login",
  component: KcPageStory,
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
  args: {
    kcContext: {
      message: {
        type: "error",
        summary: "Invalid username or password.",
      },
    },
  },
};

export const WithRegistrationDisabled: Story = {
  args: {
    kcContext: {
      realm: {
        registrationAllowed: false,
      },
    },
  },
};
