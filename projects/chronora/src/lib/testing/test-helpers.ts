import { TestBed, type ComponentFixture } from '@angular/core/testing';

/** Creates a fixture for a standalone host component and waits for the first render. */
export async function createHost<T>(host: new () => T): Promise<ComponentFixture<T>> {
  await TestBed.configureTestingModule({ imports: [host as never] }).compileComponents();
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

/** Lets pending change detection, microtasks (ngModel) and `afterNextRender` callbacks finish. */
export async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
}

/** Types text into an input the way a user would (sets the value and fires `input`). */
export async function typeText(fixture: ComponentFixture<unknown>, input: HTMLInputElement, text: string): Promise<void> {
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await settle(fixture);
}

export async function blur(fixture: ComponentFixture<unknown>, element: HTMLElement): Promise<void> {
  element.dispatchEvent(new FocusEvent('blur'));
  await settle(fixture);
}

export async function press(
  fixture: ComponentFixture<unknown>,
  target: Element,
  key: string,
  init: KeyboardEventInit = {},
): Promise<KeyboardEvent> {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  await settle(fixture);
  return event;
}

export async function clickEl(fixture: ComponentFixture<unknown>, target: Element | null): Promise<void> {
  if (!target) {
    throw new Error('clickEl: element not found');
  }
  (target as HTMLElement).click();
  await settle(fixture);
}

/** The overlay container where CDK renders popups (an empty element before the first popup opens). */
export const overlay = (): HTMLElement =>
  document.querySelector<HTMLElement>('.cdk-overlay-container') ?? document.createElement('div');
