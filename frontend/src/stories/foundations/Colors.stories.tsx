import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Foundations/Colors",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The Pearl design system color palette. All values are driven by CSS custom properties so the entire theme can be swapped by updating `:root` in `index.css`.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

// ─── Token groups ────────────────────────────────────────────────────────────

const BRAND = [
  { name: "Primary",          var: "--primary",          hex: "#6c5ce7", role: "Brand color, interactive elements, links" },
  { name: "Primary Fg",       var: "--primary-foreground", hex: "#ffffff", role: "Text on primary surfaces" },
  { name: "Ring",             var: "--ring",              hex: "#6c5ce7", role: "Focus ring, outline" },
];

const BACKGROUNDS = [
  { name: "Background",  var: "--background",  hex: "#f0f2f8", role: "Page / app background" },
  { name: "Card",        var: "--card",        hex: "#ffffff",  role: "Card surface" },
  { name: "Secondary",   var: "--secondary",   hex: "#f8faff",  role: "Secondary surfaces, hover states" },
  { name: "Muted",       var: "--muted",       hex: "#eef0f8",  role: "Disabled, subtle backgrounds" },
  { name: "Accent",      var: "--accent",      hex: "#ede9ff",  role: "Highlight, selection tint" },
  { name: "Popover",     var: "--popover",     hex: "#ffffff",  role: "Dropdown / popover background" },
];

const TEXT = [
  { name: "Foreground",        var: "--foreground",        hex: "#1a1f35", role: "Primary text" },
  { name: "Muted Foreground",  var: "--muted-foreground",  hex: "#7a849e", role: "Secondary / helper text" },
  { name: "Card Foreground",   var: "--card-foreground",   hex: "#1a1f35", role: "Text on card surfaces" },
];

const SEMANTIC = [
  { name: "Success",      var: "--success",      hex: "#10b981", role: "Positive outcomes, confirmation" },
  { name: "Warning",      var: "--warning",      hex: "#f59e0b", role: "Caution, budget alerts" },
  { name: "Destructive",  var: "--destructive",  hex: "#ec4899", role: "Errors, delete actions" },
];

const FINANCE = [
  { name: "Income",    var: "--income",    hex: "#10b981", role: "Inflows, salary, revenue" },
  { name: "Expense",   var: "--expense",   hex: "#ec4899", role: "Outflows, spending" },
  { name: "Savings",   var: "--savings",   hex: "#6c5ce7", role: "Savings goals, investments" },
  { name: "Debt",      var: "--debt",      hex: "#0ea5e9", role: "Liabilities, loans" },
  { name: "Transfer",  var: "--transfer",  hex: "#7a849e", role: "Internal transfers" },
];

const CHARTS = [
  { name: "Chart 1", var: "--chart-1", hex: "#6c5ce7", role: "Primary chart series" },
  { name: "Chart 2", var: "--chart-2", hex: "#10b981", role: "Secondary chart series" },
  { name: "Chart 3", var: "--chart-3", hex: "#f59e0b", role: "Tertiary chart series" },
  { name: "Chart 4", var: "--chart-4", hex: "#0ea5e9", role: "Quaternary chart series" },
  { name: "Chart 5", var: "--chart-5", hex: "#ec4899", role: "Quinary chart series" },
];

// ─── Components ──────────────────────────────────────────────────────────────

interface Token { name: string; var: string; hex: string; role: string }

function Swatch({ token }: { token: Token }) {
  const textOnSwatch = token.hex === "#ffffff" || token.hex === "#f0f2f8" || token.hex === "#f8faff" || token.hex === "#eef0f8" || token.hex === "#ede9ff"
    ? "#1a1f35"
    : "#ffffff";

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[#dde3f0] bg-white shadow-sm">
      <div
        className="flex h-20 items-end p-3"
        style={{ background: `hsl(var(${token.var}))` }}
      >
        <span
          className="rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold"
          style={{ background: "rgba(0,0,0,0.15)", color: textOnSwatch }}
        >
          {token.hex}
        </span>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-[#1a1f35]">{token.name}</p>
        <p className="mt-0.5 font-mono text-[11px] text-[#7a849e]">{token.var}</p>
        <p className="mt-1.5 text-[11px] leading-tight text-[#7a849e]">{token.role}</p>
      </div>
    </div>
  );
}

function Section({ title, tokens }: { title: string; tokens: Token[] }) {
  return (
    <div className="mb-10">
      <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-widest text-[#7a849e]">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {tokens.map((t) => (
          <Swatch key={t.var} token={t} />
        ))}
      </div>
    </div>
  );
}

function ColorsPage() {
  return (
    <div className="min-h-screen bg-[#f0f2f8] p-8">
      <div className="mb-8">
        <p className="mb-1 font-display text-xs font-bold uppercase tracking-widest text-[#7a849e]">
          Foundations
        </p>
        <h1 className="font-display text-4xl font-extrabold text-[#1a1f35]">Colors</h1>
        <p className="mt-2 max-w-xl text-[#7a849e]">
          All colors are defined as HSL CSS custom properties. Use the Tailwind utilities
          (e.g. <code className="rounded bg-white px-1 py-0.5 text-[#6c5ce7]">bg-primary</code>,{" "}
          <code className="rounded bg-white px-1 py-0.5 text-[#6c5ce7]">text-income</code>) or
          reference the CSS variable directly.
        </p>
      </div>
      <Section title="Brand" tokens={BRAND} />
      <Section title="Backgrounds & Surfaces" tokens={BACKGROUNDS} />
      <Section title="Text" tokens={TEXT} />
      <Section title="Semantic" tokens={SEMANTIC} />
      <Section title="Finance" tokens={FINANCE} />
      <Section title="Charts" tokens={CHARTS} />
    </div>
  );
}

export const AllColors: Story = {
  name: "All Colors",
  render: () => <ColorsPage />,
};
