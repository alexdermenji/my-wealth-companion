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
    await listbox.getByRole('option', { name: optionText, exact: true }).click();
  }

  async getValue(): Promise<string> {
    return (await this.trigger.innerText()).trim();
  }
}
