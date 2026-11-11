import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TEAM } from '../../constants/team';
import AboutPage from './AboutPage';

describe('AboutPage', () => {
  it('has the three sections, in order', () => {
    render(<AboutPage onBack={() => {}} />);
    expect(screen.getByRole('heading', { level: 1, name: 'About Us' })).toBeInTheDocument();
    const sections = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(sections.indexOf('Our Core Values')).toBeGreaterThan(-1);
    expect(sections.indexOf('Our Core Values')).toBeLessThan(sections.indexOf('Our Team'));
    expect(sections.indexOf('Our Team')).toBeLessThan(sections.indexOf('Our Approach'));
  });

  it('shows every team member with a role', () => {
    render(<AboutPage onBack={() => {}} />);
    for (const person of TEAM) {
      expect(screen.getByRole('heading', { name: person.name })).toBeInTheDocument();
      expect(person.role.trim()).not.toBe('');
    }
  });

  it('never claims the questions are past papers', () => {
    const { container } = render(<AboutPage onBack={() => {}} />);
    expect(container.textContent).toMatch(/not official past papers/i);
  });
});
