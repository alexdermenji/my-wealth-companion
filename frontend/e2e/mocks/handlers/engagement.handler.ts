import { Page } from '@playwright/test';
import type { EngagementSummary } from '../../../src/features/engagement/types';

const isSupabase = (url: URL) => url.hostname.includes('supabase.co');

const today = new Date().toISOString().split('T')[0];
const recentDays = Array.from({ length: 28 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (27 - i));
  return { date: d.toISOString().split('T')[0], logged: i >= 24 };
});

const mockEngagement: EngagementSummary = {
  streak: {
    tracking: {
      currentStreak: 4,
      longestStreak: 7,
      todayStatus: 'pending',
      recentDays,
    },
    noSpend: {
      currentStreak: 1,
      longestStreak: 3,
      todayStatus: 'no-spend',
    },
  },
  tasks: {
    daysSinceLastTransaction: 0,
    overBudgetCategories: [],
    nextMonthBudgetFilled: false,
    currentMonthNetWorthFilled: false,
  },
  insights: {
    weeklyTrackedTotal: 250,
    avgDailySpend: 30,
  },
};

export async function setupEngagementMock(page: Page) {
  await page.route(
    (url) => isSupabase(url) && url.pathname === '/rest/v1/rpc/get_engagement_summary',
    async (route) => {
      await route.fulfill({ json: mockEngagement });
    }
  );
}
