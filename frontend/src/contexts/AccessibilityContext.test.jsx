import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach } from 'vitest';
import { AccessibilityProvider, useAccessibility } from './AccessibilityContext';

const STORAGE_KEY = 'pathwaygh_accessibility';

const Probe = () => {
  const { dyslexiaFont, textScale, setDyslexiaFont, setTextScale } = useAccessibility();
  return (
    <div>
      <span data-testid="dyslexia">{String(dyslexiaFont)}</span>
      <span data-testid="scale">{textScale}</span>
      <button onClick={() => setDyslexiaFont(true)}>Enable dyslexia font</button>
      <button onClick={() => setTextScale('large')}>Large text</button>
      <button onClick={() => setTextScale('not-a-real-scale')}>Invalid scale</button>
    </div>
  );
};

describe('AccessibilityContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-dyslexia-font');
    document.documentElement.removeAttribute('data-text-scale');
  });

  it('defaults to no dyslexia font and normal text scale', () => {
    render(<AccessibilityProvider><Probe /></AccessibilityProvider>);
    expect(screen.getByTestId('dyslexia').textContent).toBe('false');
    expect(screen.getByTestId('scale').textContent).toBe('normal');
  });

  it('sets the data-dyslexia-font and data-text-scale attributes on <html> so CSS can react to them', () => {
    render(<AccessibilityProvider><Probe /></AccessibilityProvider>);
    expect(document.documentElement.getAttribute('data-dyslexia-font')).toBe('false');
    expect(document.documentElement.getAttribute('data-text-scale')).toBe('normal');
  });

  it('enabling dyslexia font updates state, the html attribute, and localStorage', async () => {
    const user = userEvent.setup();
    render(<AccessibilityProvider><Probe /></AccessibilityProvider>);

    await user.click(screen.getByText('Enable dyslexia font'));

    expect(screen.getByTestId('dyslexia').textContent).toBe('true');
    expect(document.documentElement.getAttribute('data-dyslexia-font')).toBe('true');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).dyslexiaFont).toBe(true);
  });

  it('changing text scale updates state, the html attribute, and localStorage', async () => {
    const user = userEvent.setup();
    render(<AccessibilityProvider><Probe /></AccessibilityProvider>);

    await user.click(screen.getByText('Large text'));

    expect(screen.getByTestId('scale').textContent).toBe('large');
    expect(document.documentElement.getAttribute('data-text-scale')).toBe('large');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).textScale).toBe('large');
  });

  it('rejects an invalid text scale rather than storing garbage', async () => {
    const user = userEvent.setup();
    render(<AccessibilityProvider><Probe /></AccessibilityProvider>);

    await user.click(screen.getByText('Invalid scale'));

    expect(screen.getByTestId('scale').textContent).toBe('normal');
  });

  it('restores a previously saved preference on next load', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ dyslexiaFont: true, textScale: 'larger' }));
    render(<AccessibilityProvider><Probe /></AccessibilityProvider>);

    expect(screen.getByTestId('dyslexia').textContent).toBe('true');
    expect(screen.getByTestId('scale').textContent).toBe('larger');
  });

  it('falls back to defaults if localStorage holds malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json{{{');
    render(<AccessibilityProvider><Probe /></AccessibilityProvider>);

    expect(screen.getByTestId('dyslexia').textContent).toBe('false');
    expect(screen.getByTestId('scale').textContent).toBe('normal');
  });
});
