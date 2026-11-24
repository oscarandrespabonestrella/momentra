import { Routes } from '@angular/router';

export interface DocPage { path: string; title: string; group: string; load: () => Promise<unknown>; }

const p = (group: string, path: string, title: string, load: DocPage['load']): DocPage => ({ group, path, title, load });

export const PAGES: DocPage[] = [
  p('Get started', 'overview', 'Overview', () => import('./pages/overview').then((m) => m.Overview)),
  p('Get started', 'globalization', 'Globalization & themes', () => import('./pages/globalization').then((m) => m.GlobalizationPage)),
  p('Components', 'date-input', 'DateInput', () => import('./pages/date-input').then((m) => m.DateInputPage)),
  p('Components', 'date-picker', 'DatePicker', () => import('./pages/date-picker').then((m) => m.DatePickerPage)),
  p('Components', 'time-picker', 'TimePicker', () => import('./pages/time-picker').then((m) => m.TimePickerPage)),
  p('Components', 'datetime-picker', 'DateTimePicker', () => import('./pages/datetime-picker').then((m) => m.DateTimePickerPage)),
  p('Components', 'datetime-input', 'DateTimeInput', () => import('./pages/datetime-input').then((m) => m.DateTimeInputPage)),
  p('Components', 'date-range', 'DateRange', () => import('./pages/date-range').then((m) => m.DateRangePage)),
  p('Components', 'calendar', 'Calendar', () => import('./pages/calendar').then((m) => m.CalendarPage)),
  p('Guides', 'forms', 'Forms & validation', () => import('./pages/forms').then((m) => m.FormsPage)),
  p('Guides', 'accessibility', 'Accessibility & keyboard', () => import('./pages/accessibility').then((m) => m.AccessibilityPage)),
];

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  ...PAGES.map((x) => ({ path: x.path, title: `${x.title} · Chronora`, loadComponent: x.load as never })),
  { path: '**', redirectTo: 'overview' },
];
