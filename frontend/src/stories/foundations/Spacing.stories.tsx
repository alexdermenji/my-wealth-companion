import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Foundations/Spacing",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Spacing follows Tailwind's default 4px base grid. Border radius tokens use the `--radius` CSS variable (`0.75rem`) as the base, with `lg`, `md`, and `sm` variants derived from it.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

const SPACING = [
  { token: "1",  px: 4,   tw: "p-1"  },
  { token: "2",  px: 8,   tw: "p-2"  },
  { token: "3",  px: 12,  tw: "p-3"  },
  { token: "4",  px: 16,  tw: "p-4"  },
  { token: "5",  px: 20,  tw: "p-5"  },
  { token: "6",  px: 24,  tw: "p-6"  },
  { token: "8",  px: 32,  tw: "p-8"  },
  { token: "10", px: 40,  tw: "p-10" },
  { token: "12", px: 48,  tw: "p-12" },
  { token: "16", px: 64,  tw: "p-16" },
];

const RADIUS = [
  { name: "sm",   var: "calc(var(--radius) - 4px)", approx: "8px",  tw: "rounded-sm"  },
  { name: "md",   var: "calc(var(--radius) - 2px)", approx: "10px", tw: "rounded-md"  },
  { name: "lg",   var: "var(--radius)",             approx: "12px", tw: "rounded-lg"  },
  { name: "xl",   var: "0.75rem",                   approx: "16px", tw: "rounded-xl"  },
  { name: "2xl",  var: "1rem",                      approx: "20px", tw: "rounded-2xl" },
  { name: "full", var: "9999px",                    approx: "∞",    tw: "rounded-full"},
];

function SpacingPage() {
  return (
    <div className="min-h-screen bg-[#f0f2f8] p-8">
      <div className="mb-8">
        <p className="mb-1 font-display text-xs font-bold uppercase tracking-widest text-[#7a849e]">
          Foundations
        </p>
        <h1 className="font-display text-4xl font-extrabold text-[#1a1f35]">Spacing</h1>
        <p className="mt-2 text-[#7a849e]">4px grid · CSS variable radius</p>
      </div>

      {/* Spacing scale */}
      <div className="mb-10 rounded-2xl border border-[#dde3f0] bg-white p-8 shadow-sm">
        <p className="mb-6 font-display text-xs font-bold uppercase tracking-widest text-[#6c5ce7]">
          Spacing Scale
        </p>
        <div className="space-y-3">
          {SPACING.map(({ token, px, tw }) => (
            <div key={token} className="flex items-center gap-4">
              <div className="flex w-32 shrink-0 items-center gap-3">
                <span className="font-display text-sm font-bold text-[#1a1f35]">{token}</span>
                <span className="font-mono text-xs text-[#7a849e]">{px}px</span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="shrink-0 rounded-sm bg-[#6c5ce7]"
                  style={{ width: px, height: 20 }}
                />
                <code className="rounded bg-[#f0f2f8] px-2 py-0.5 font-mono text-xs text-[#6c5ce7]">
                  {tw}
                </code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Border radius */}
      <div className="rounded-2xl border border-[#dde3f0] bg-white p-8 shadow-sm">
        <p className="mb-6 font-display text-xs font-bold uppercase tracking-widest text-[#6c5ce7]">
          Border Radius · Base: <code className="font-mono text-[#1a1f35]">--radius: 0.75rem (12px)</code>
        </p>
        <div className="flex flex-wrap gap-6">
          {RADIUS.map(({ name, approx, tw }) => (
            <div key={name} className="flex flex-col items-center gap-3">
              <div
                className={`h-16 w-16 bg-[#6c5ce7] ${tw}`}
                style={{ opacity: 0.85 }}
              />
              <div className="text-center">
                <p className="font-display text-sm font-bold text-[#1a1f35]">{name}</p>
                <p className="font-mono text-[11px] text-[#7a849e]">~{approx}</p>
                <code className="font-mono text-[10px] text-[#6c5ce7]">{tw}</code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const AllSpacing: Story = {
  name: "Spacing & Radius",
  render: () => <SpacingPage />,
};
