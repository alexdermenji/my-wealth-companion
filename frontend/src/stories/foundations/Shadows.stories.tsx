import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Foundations/Shadows",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Shadow tokens create the sense of elevation in the Pearl UI. Use `shadow-sm` for cards, `shadow-md` for panels and the main table, `shadow-lg` for floating elements.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

const SHADOWS = [
  {
    name: "None",
    tw: "shadow-none",
    css: "none",
    usage: "Flat elements, table cells, inline components",
  },
  {
    name: "SM",
    tw: "shadow-sm",
    css: "0 1px 2px rgba(0,0,0,.05)",
    usage: "Cards, allocation strip, status bar",
  },
  {
    name: "MD",
    tw: "shadow-md",
    css: "0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -1px rgba(0,0,0,.06)",
    usage: "Main table card, active elements",
  },
  {
    name: "LG",
    tw: "shadow-lg",
    css: "0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05)",
    usage: "Dialogs, drawers, popovers",
  },
  {
    name: "XL",
    tw: "shadow-xl",
    css: "0 20px 25px -5px rgba(0,0,0,.1), 0 10px 10px -5px rgba(0,0,0,.04)",
    usage: "Full-screen overlays, command palette",
  },
];

function ShadowsPage() {
  return (
    <div className="min-h-screen bg-[#f0f2f8] p-8">
      <div className="mb-8">
        <p className="mb-1 font-display text-xs font-bold uppercase tracking-widest text-[#7a849e]">
          Foundations
        </p>
        <h1 className="font-display text-4xl font-extrabold text-[#1a1f35]">Shadows</h1>
        <p className="mt-2 text-[#7a849e]">Elevation tokens — applied via Tailwind shadow utilities</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SHADOWS.map(({ name, tw, css, usage }) => (
          <div key={name} className="flex flex-col gap-4 rounded-2xl border border-[#dde3f0] bg-white p-6">
            <p className="font-display text-xs font-bold uppercase tracking-widest text-[#7a849e]">
              shadow-{name.toLowerCase()}
            </p>

            {/* Preview box */}
            <div className="flex h-24 items-center justify-center">
              <div
                className={`h-16 w-32 rounded-xl bg-white ${tw}`}
                style={{ border: "1px solid #dde3f0" }}
              />
            </div>

            {/* Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <code className="rounded bg-[#f0f2f8] px-2 py-0.5 font-mono text-xs text-[#6c5ce7]">
                  {tw}
                </code>
              </div>
              <p className="font-mono text-[10px] leading-relaxed text-[#7a849e] break-all">{css}</p>
              <p className="text-xs text-[#7a849e]">{usage}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const AllShadows: Story = {
  name: "All Shadows",
  render: () => <ShadowsPage />,
};
