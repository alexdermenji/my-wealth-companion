import { Locator, Page } from '@playwright/test';

export class RadixSelect {
  constructor(
    private page: Page,
    private trigger: Locator
  ) {}

  async selectOption(optionText: string) {
    await this.trigger.click();
    const listbox = this.page.locator('[role="listbox"]');
    await listbox.waitFor({ state: 'visible' });
    const option = listbox.getByRole('option', { name: optionText, exact: true });
    await option.scrollIntoViewIfNeeded();
    await option.click();
    await listbox.waitFor({ state: 'hidden' });
  }

  async getValue(): Promise<string> {
    return (await this.trigger.innerText()).trim();
  }
}
