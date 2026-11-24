import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DateAdapter } from '../adapters/date-adapter';
import { NativeDateAdapter } from '../adapters/native-date-adapter';
import { MOMENTRA_DATE_ADAPTER } from '../tokens/tokens';
import { MomentraSettings } from '../services/momentra-settings';
import { DEFAULT_MOMENTRA_CONFIG, provideMomentra } from './momentra-config';
import { CalendarComponent } from '../../calendar/calendar/calendar.component';
import { DateInputComponent } from '../../inputs/date-input/date-input.component';
import { EN_US_LOCALE, ES_ES_LOCALE, createLocale, type MomentraLocale } from '../../localization/locale';
import { createHost, settle } from '../../testing/test-helpers';

describe('global configuration', () => {
  it('has sensible defaults without any provider', () => {
    const settings = TestBed.inject(MomentraSettings);
    expect(settings.config).toEqual(DEFAULT_MOMENTRA_CONFIG);
    expect(settings.resolveLocale()).toEqual(EN_US_LOCALE);
    expect(settings.adapter()).toBeInstanceOf(NativeDateAdapter);
    expect(TestBed.inject(MOMENTRA_DATE_ADAPTER)).toBeInstanceOf(NativeDateAdapter);
  });

  it('merges provideMomentra options and freezes the result', () => {
    TestBed.configureTestingModule({
      providers: [provideMomentra({ locale: 'es-ES', theme: 'dark', showTodayButton: false })],
    });
    const { config } = TestBed.inject(MomentraSettings);
    expect(config.locale).toBe('es-ES');
    expect(config.theme).toBe('dark');
    expect(config.showTodayButton).toBe(false);
    expect(config.closeOnSelect).toBe(true); // default kept
    expect(Object.isFrozen(config)).toBe(true);
  });

  it('does not share mutable state between injectors', () => {
    expect(Object.isFrozen(DEFAULT_MOMENTRA_CONFIG)).toBe(true);
    TestBed.configureTestingModule({ providers: [provideMomentra({ theme: 'dark' })] });
    expect(TestBed.inject(MomentraSettings).config.theme).toBe('dark');
    expect(DEFAULT_MOMENTRA_CONFIG.theme).toBe('light');
  });

  it('supports a custom adapter class', () => {
    // A class expression on purpose: Vite 8.3's SSR transform leaves the imported name in a nested
    // `class X extends Import {}` declaration un-rewritten, so it is undefined in the full test run.
    const CustomAdapter = class CustomAdapter extends NativeDateAdapter {};
    TestBed.configureTestingModule({ providers: [provideMomentra({ dateAdapter: CustomAdapter })] });
    expect(TestBed.inject(MOMENTRA_DATE_ADAPTER)).toBeInstanceOf(CustomAdapter);
    expect(TestBed.inject(MOMENTRA_DATE_ADAPTER)).toBeInstanceOf(DateAdapter);
  });

  describe('locale resolution', () => {
    it('resolves built-in, Intl-derived and registered locales', () => {
      const custom: MomentraLocale = { ...EN_US_LOCALE, code: 'xx-XX', dateFormat: 'dd.MM.yy' };
      TestBed.configureTestingModule({ providers: [provideMomentra({ locales: [custom] })] });
      const settings = TestBed.inject(MomentraSettings);
      expect(settings.resolveLocale({ locale: 'es-ES' })).toEqual(ES_ES_LOCALE);
      expect(settings.resolveLocale({ locale: 'xx-XX' }).dateFormat).toBe('dd.MM.yy');
      const german = settings.resolveLocale({ locale: 'de-DE' });
      expect(german.monthNames[2]).toBe('März');
      expect(german.dateFormat).toBe('dd.MM.yyyy');
      expect(german.firstDayOfWeek).toBe(1);
      expect(german.timeFormat).toBe('HH:mm');
      const japanese = settings.resolveLocale({ locale: 'ja-JP' });
      expect(japanese.dateFormat).toBe('yyyy/MM/dd');
    });

    it('applies global and per-call overrides in the right order', () => {
      TestBed.configureTestingModule({
        providers: [provideMomentra({ dateFormat: 'yyyy-MM-dd', firstDayOfWeek: 1, validationMessages: { required: 'Needed!' } })],
      });
      const settings = TestBed.inject(MomentraSettings);
      const locale = settings.resolveLocale();
      expect(locale.dateFormat).toBe('yyyy-MM-dd');
      expect(locale.firstDayOfWeek).toBe(1);
      expect(locale.dateTimeFormat).toBe('yyyy-MM-dd hh:mm a'); // composed from the overridden date format
      expect(locale.validationMessages.required).toBe('Needed!');
      expect(locale.validationMessages.mtrMinDate).toContain('on or after');
      expect(settings.resolveLocale({ dateFormat: 'dd/MM/yyyy', firstDayOfWeek: 6 }).dateFormat).toBe('dd/MM/yyyy');
      expect(settings.resolveLocale({ firstDayOfWeek: 6 }).firstDayOfWeek).toBe(6);
      expect(settings.resolveLocale({ firstDayOfWeek: 0 }).firstDayOfWeek).toBe(0); // 0 (Sunday) is a real override
    });

    it('accepts a full locale object', () => {
      const custom = createLocale('fr-FR', { firstDayOfWeek: 1 });
      const settings = TestBed.inject(MomentraSettings);
      expect(settings.resolveLocale({ locale: custom })).toEqual(custom);
    });
  });
});

describe('configuration reaching components', () => {
  it('applies the global theme and lets a component override it', async () => {
    TestBed.configureTestingModule({ providers: [provideMomentra({ theme: 'dark' })] });
    @Component({
      imports: [CalendarComponent],
      template: `<mtr-calendar class="a" /><mtr-calendar class="b" theme="auto" />`,
    })
    class Host {}
    const fixture = await createHost(Host);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.a')!.getAttribute('data-mtr-theme')).toBe('dark');
    expect(el.querySelector('.b')!.getAttribute('data-mtr-theme')).toBe('auto');
  });

  it('switches the global theme at runtime without touching component overrides', async () => {
    @Component({
      imports: [CalendarComponent],
      template: `<mtr-calendar class="a" /><mtr-calendar class="b" theme="light" />`,
    })
    class Host {}
    const fixture = await createHost(Host);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.a')!.getAttribute('data-mtr-theme')).toBe('light');
    TestBed.inject(MomentraSettings).theme.set('dark');
    await settle(fixture);
    expect(el.querySelector('.a')!.getAttribute('data-mtr-theme')).toBe('dark');
    expect(el.querySelector('.b')!.getAttribute('data-mtr-theme')).toBe('light');
  });

  it('applies global locale, formats and placeholder to inputs, with component overrides winning', async () => {
    TestBed.configureTestingModule({
      providers: [provideMomentra({ locale: 'es-ES', placeholder: 'Elige fecha' })],
    });
    @Component({
      imports: [DateInputComponent],
      template: `<mtr-date-input class="a" /><mtr-date-input class="b" locale="en-US" format="yyyy-MM-dd" placeholder="" />`,
    })
    class Host {}
    const fixture = await createHost(Host);
    const el = fixture.nativeElement as HTMLElement;
    await settle(fixture);
    expect(el.querySelector<HTMLInputElement>('.a input')!.placeholder).toBe('Elige fecha');
    expect(el.querySelector<HTMLInputElement>('.b input')!.placeholder).toBe('');
  });

  it('hides the Today button globally and lets a component turn it back on', async () => {
    TestBed.configureTestingModule({ providers: [provideMomentra({ showTodayButton: false })] });
    @Component({
      imports: [CalendarComponent],
      template: `<mtr-calendar class="a" /><mtr-calendar class="b" [showToday]="true" />`,
    })
    class Host {}
    const fixture = await createHost(Host);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.a .mtr-today-btn')).toBeNull();
    expect(el.querySelector('.b .mtr-today-btn')).not.toBeNull();
  });

  it('renders six weeks when fixedWeeks is configured', async () => {
    TestBed.configureTestingModule({ providers: [provideMomentra({ fixedWeeks: true })] });
    @Component({ imports: [CalendarComponent], template: `<mtr-calendar [initialDate]="d" />` })
    class Host {
      d = new Date(2026, 1, 1);
    }
    const fixture = await createHost(Host);
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr').length).toBe(6);
  });

  it('localizes validation messages with the locale and custom overrides', async () => {
    TestBed.configureTestingModule({
      providers: [provideMomentra({ locale: 'es-ES', validationMessages: { mtrInvalidDate: 'Fecha rara' } })],
    });
    const settings = TestBed.inject(MomentraSettings);
    const messages = settings.resolveLocale().validationMessages;
    expect(messages.mtrInvalidDate).toBe('Fecha rara');
    expect(messages.required).toBe('Este campo es obligatorio.');
  });
});

describe('locales', () => {
  it('provides English UI strings by default for derived locales and Spanish for the built-in es-ES', () => {
    expect(createLocale('de-DE').labels.today).toBe('Today');
    expect(ES_ES_LOCALE.labels.today).toBe('Hoy');
    expect(ES_ES_LOCALE.validationMessages.mtrMinDate).toContain('{min}');
  });

  it('derives 12-hour clocks and meridiem names from Intl', () => {
    const us = createLocale('en-US');
    expect(us.timeFormat).toBe('hh:mm a');
    expect(us.meridiem.am).toBe('AM');
    expect(createLocale('fr-FR').timeFormat).toBe('HH:mm');
  });
});
