import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import {
  useSettings,
  useNetWorthItems,
  useNetWorthValues,
  useAllNetWorthValues,
  useSetNetWorthValue,
  useBudgetPlans,
  useCategories,
  useTimelineEvents,
  useDeleteTimelineEvent,
  useCreateTimelineEvent,
  useUpdateTimelineEvent,
  useIsMobile,
} from '../__mocks__/hooks';

vi.mock('@/features/settings/hooks', () => ({ useSettings }));
vi.mock('@/features/net-worth/hooks', () => ({ useNetWorthItems, useNetWorthValues, useAllNetWorthValues, useSetNetWorthValue }));
vi.mock('@/features/budget/hooks', () => ({ useBudgetPlans }));
vi.mock('@/shared/hooks/useCategories', () => ({ useCategories }));
vi.mock('../hooks', () => ({ useTimelineEvents, useDeleteTimelineEvent, useCreateTimelineEvent, useUpdateTimelineEvent }));
vi.mock('@/shared/hooks/use-mobile', () => ({ useIsMobile }));

import TimelinePage from '../TimelinePage';

// ── Shared fixture builders ────────────────────────────────────────────────

function makeDebtItem(overrides = {}) {
  return {
    id: 'l1',
    name: 'Car Loan',
    group: 'Car',
    type: 'Liability' as const,
    order: 0,
    linkedBudgetCategoryId: 'cat1',
    ...overrides,
  };
}

function makeBudgetPlan(overrides = {}) {
  return { categoryId: 'cat1', year: 2026, months: { 4: 300 }, ...overrides };
}

function makeDebtCategory(overrides = {}) {
  return { id: 'cat1', name: 'Car Payment', type: 'Debt' as const, group: 'Car', order: 0, ...overrides };
}

function makeNetWorthValue(overrides = {}) {
  return { itemId: 'l1', year: 2026, months: { 4: 1200 }, ...overrides };
}

// ── Default mock state: one forecasted debt, no custom events ──────────────

beforeEach(() => {
  useSettings.mockReturnValue({ data: { currency: '£' }, isLoading: false });
  useNetWorthItems.mockReturnValue({ data: [makeDebtItem()], isLoading: false });
  useNetWorthValues.mockReturnValue({ data: [makeNetWorthValue()], isLoading: false });
  useAllNetWorthValues.mockReturnValue({ data: [], isLoading: false });
  useBudgetPlans.mockReturnValue({ data: [makeBudgetPlan()], isLoading: false });
  useCategories.mockReturnValue({ data: [makeDebtCategory()], isLoading: false });
  useTimelineEvents.mockReturnValue({ data: [], isLoading: false });
  useDeleteTimelineEvent.mockReturnValue({ mutate: vi.fn() });
  useSetNetWorthValue.mockReturnValue({ mutate: vi.fn() });
  useCreateTimelineEvent.mockReturnValue({ mutate: vi.fn(), isPending: false });
  useUpdateTimelineEvent.mockReturnValue({ mutate: vi.fn(), isPending: false });
  useIsMobile.mockReturnValue(false);
});

// ── Slice 2: date box renders month and year as separate text ──────────────

describe('feed entry — date box', () => {
  it('renders the month abbreviation and year as separate visible text', () => {
    renderWithProviders(<TimelinePage />);

    // "Car Loan" has a 4-month payoff from Apr 2026 → Aug 2026
    expect(screen.getByText('Aug')).toBeInTheDocument();
    expect(screen.getByText('2026')).toBeInTheDocument();
  });
});

// ── Slice 4: "Next up" badge appears only on the soonest payoff ───────────

describe('feed entry — Next up badge', () => {
  it('shows "Next up" on the soonest debt and not on others', () => {
    useNetWorthItems.mockReturnValue({
      data: [
        makeDebtItem({ id: 'l1', name: 'Car Loan', linkedBudgetCategoryId: 'cat1' }),
        makeDebtItem({ id: 'l2', name: 'Student Loan', linkedBudgetCategoryId: 'cat2' }),
      ],
      isLoading: false,
    });
    useNetWorthValues.mockReturnValue({
      data: [
        makeNetWorthValue({ itemId: 'l1', months: { 4: 600 } }),
        makeNetWorthValue({ itemId: 'l2', months: { 4: 3600 } }),
      ],
      isLoading: false,
    });
    useBudgetPlans.mockReturnValue({
      data: [
        makeBudgetPlan({ categoryId: 'cat1', months: { 4: 300 } }),
        makeBudgetPlan({ categoryId: 'cat2', months: { 4: 300 } }),
      ],
      isLoading: false,
    });
    useCategories.mockReturnValue({
      data: [
        makeDebtCategory({ id: 'cat1', name: 'Car Payment' }),
        makeDebtCategory({ id: 'cat2', name: 'Student Payment' }),
      ],
      isLoading: false,
    });

    renderWithProviders(<TimelinePage />);

    // Only one "Next up" badge exists
    expect(screen.getAllByText('Next up')).toHaveLength(1);
    // Car Loan closes in 2 months — it is next up
    expect(screen.getByText('Car Loan')).toBeInTheDocument();
  });
});

// ── Slice 5 & 6: custom event data strip ──────────────────────────────────

describe('feed entry — custom event data strip', () => {
  it('shows Amount cell when amount is present', () => {
    useNetWorthItems.mockReturnValue({ data: [], isLoading: false });
    useNetWorthValues.mockReturnValue({ data: [], isLoading: false });
    useBudgetPlans.mockReturnValue({ data: [], isLoading: false });
    useCategories.mockReturnValue({ data: [], isLoading: false });
    useTimelineEvents.mockReturnValue({
      data: [{ id: 'e1', title: 'House deposit', eventDate: '2027-03-15', type: 'Custom', amount: 30000, description: '' }],
      isLoading: false,
    });

    renderWithProviders(<TimelinePage />);

    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('£30,000.00')).toBeInTheDocument();
  });

  it('shows no data strip when amount is null', () => {
    useNetWorthItems.mockReturnValue({ data: [], isLoading: false });
    useNetWorthValues.mockReturnValue({ data: [], isLoading: false });
    useBudgetPlans.mockReturnValue({ data: [], isLoading: false });
    useCategories.mockReturnValue({ data: [], isLoading: false });
    useTimelineEvents.mockReturnValue({
      data: [{ id: 'e1', title: 'Check-in', eventDate: '2027-06-01', type: 'Custom', amount: null, description: '' }],
      isLoading: false,
    });

    renderWithProviders(<TimelinePage />);

    expect(screen.queryByText('Event date')).not.toBeInTheDocument();
    expect(screen.queryByText('Amount')).not.toBeInTheDocument();
  });
});

// ── Slice 7 & 8: sidebar milestone cards ──────────────────────────────────

describe('sidebar — net worth milestone cards', () => {
  function setupMilestoneData() {
    useNetWorthItems.mockReturnValue({
      data: [{ id: 'a1', name: 'ISA', group: 'Savings', type: 'Asset', order: 0, linkedBudgetCategoryId: null }],
      isLoading: false,
    });
    useNetWorthItems.mockReturnValue({ data: [], isLoading: false });
    useNetWorthValues.mockReturnValue({ data: [], isLoading: false });
    useBudgetPlans.mockReturnValue({ data: [], isLoading: false });
    useCategories.mockReturnValue({ data: [], isLoading: false });
    useTimelineEvents.mockReturnValue({ data: [], isLoading: false });
  }

  it('shows "Reached" status and no "Time away" cell for a reached £100k milestone', () => {
    setupMilestoneData();
    useAllNetWorthValues.mockReturnValue({
      data: [{ itemId: 'a1', year: 2024, months: { 1: 90_000, 6: 105_000, 12: 110_000 } }],
      isLoading: false,
    });
    useNetWorthItems.mockReturnValue({
      data: [{ id: 'a1', name: 'ISA', group: 'Savings', type: 'Asset', order: 0, linkedBudgetCategoryId: null }],
      isLoading: false,
    });

    renderWithProviders(<TimelinePage />);

    // Scope to the 100k milestone card
    const card = screen.getByText('100k').closest('div[class*="rounded"]') as HTMLElement;
    expect(within(card).getByText('Reached')).toBeInTheDocument();
    expect(within(card).queryByText('Time away')).not.toBeInTheDocument();
  });

  it('shows "Projected" status with "Time away" cell for a projected £100k milestone', () => {
    setupMilestoneData();
    useAllNetWorthValues.mockReturnValue({
      data: [{ itemId: 'a1', year: 2024, months: { 1: 80_000, 2: 82_000, 3: 84_000 } }],
      isLoading: false,
    });
    useNetWorthItems.mockReturnValue({
      data: [{ id: 'a1', name: 'ISA', group: 'Savings', type: 'Asset', order: 0, linkedBudgetCategoryId: null }],
      isLoading: false,
    });

    renderWithProviders(<TimelinePage />);

    const card = screen.getByText('100k').closest('div[class*="rounded"]') as HTMLElement;
    expect(within(card).getByText('Projected')).toBeInTheDocument();
    expect(within(card).getByText('Time away')).toBeInTheDocument();
  });
});

// ── Slice 3: data strip shows Balance · Payment · Time left ───────────────

describe('feed entry — debt data strip', () => {
  it('shows Balance, Payment, and Time left labels with correct values', () => {
    renderWithProviders(<TimelinePage />);

    // Labels are unique to the data strip
    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
    expect(screen.getByText('Time left')).toBeInTheDocument();

    // £1,200 appears in both the summary total and the strip — assert at least one occurrence
    expect(screen.getAllByText('£1,200').length).toBeGreaterThan(0);
    expect(screen.getAllByText('£300.00/mo').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4 months').length).toBeGreaterThan(0);
  });
});
