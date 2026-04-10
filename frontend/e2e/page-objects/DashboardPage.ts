import { Page, Locator } from '@playwright/test';
import { RadixSelect } from './components/RadixSelect';

export class DashboardPage {
  readonly heading: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Budget Dashboard' });
  }

  async goto() {
    await this.page.goto('/');
    await this.heading.waitFor();
  }

  async selectYear(year: string) {
    const triggers = this.page.locator('.flex.gap-2 button[role="combobox"]');
    const yearSelect = new RadixSelect(this.page, triggers.first());
    await yearSelect.selectOption(year);
  }

  async selectMonth(month: string) {
    const triggers = this.page.locator('.flex.gap-2 button[role="combobox"]');
    const monthSelect = new RadixSelect(this.page, triggers.nth(1));
    await monthSelect.selectOption(month);
  }

  /** Returns the tracked-amount text from a navigator tile (e.g. "$3,500"). */
  async getSummaryValue(label: string): Promise<string> {
    const tile = this.page.getByRole('button', { name: new RegExp(label, 'i') });
    return tile.locator('.text-lg').innerText();
  }

  /** The navigator tile button for a given budget type. */
  getNavigatorTile(type: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(type, 'i') });
  }

  /** The h3 CardTitle inside the detail panel showing the active type name. */
  getDetailPanelTitle(): Locator {
    return this.page.getByRole('heading', { level: 3 });
  }

  /**
   * A category row in the desktop detail table.
   * Uses getByRole('cell') which excludes display:none elements, so it only
   * matches the visible desktop table — not the hidden mobile layout spans.
   */
  getDetailPanelCategory(name: string): Locator {
    return this.page.getByRole('cell', { name, exact: true });
  }

  getYearTrigger(): Locator {
    return this.page.locator('.flex.gap-2 button[role="combobox"]').first();
  }

  getMonthTrigger(): Locator {
    return this.page.locator('.flex.gap-2 button[role="combobox"]').nth(1);
  }
}
