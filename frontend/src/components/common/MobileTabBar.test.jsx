import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import MobileTabBar from './MobileTabBar';
import { LanguageProvider } from '../../contexts/LanguageContext';

const LocationProbe = () => <div data-testid="path">{useLocation().pathname}</div>;

const renderAt = (path, user = { full_name: 'Ama Mensah', email: 'ama@example.com' }, onLogout = vi.fn()) =>
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[path]}>
        <MobileTabBar user={user} onLogout={onLogout} />
        <Routes>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>
  );

const tabBar = () => screen.getByRole('navigation', { name: 'Main' });

describe('MobileTabBar', () => {
  it('shows the four core tabs plus More', () => {
    renderAt('/');
    const labels = within(tabBar()).getAllByRole('button').map((b) => b.textContent);
    expect(labels).toEqual(['Home', 'Learn', 'Practice', 'Explore', 'More']);
  });

  it('marks the tab for the current URL as the current page, including nested routes', () => {
    renderAt('/learn/shs-mathematics/lessons/1');
    expect(within(tabBar()).getByRole('button', { name: 'Learn' })).toHaveAttribute('aria-current', 'page');
    expect(within(tabBar()).getByRole('button', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('highlights More when the current page lives in the More sheet', () => {
    renderAt('/plan');
    expect(within(tabBar()).getByRole('button', { name: 'More' }).className).toContain('is-active');
  });

  it('navigates when a tab is pressed', async () => {
    renderAt('/');
    await userEvent.click(within(tabBar()).getByRole('button', { name: 'Practice' }));
    expect(screen.getByTestId('path')).toHaveTextContent('/practice');
  });

  it('opens the More sheet with the remaining pages and account controls', async () => {
    renderAt('/');
    await userEvent.click(within(tabBar()).getByRole('button', { name: 'More' }));
    const sheet = screen.getByRole('dialog', { name: 'More' });
    for (const label of ['Flashcards', 'Plan', 'Progress', 'Profile', 'Community']) {
      expect(within(sheet).getByRole('button', { name: label })).toBeInTheDocument();
    }
    expect(within(sheet).getByText('Ama Mensah')).toBeInTheDocument();
    expect(within(sheet).getByRole('combobox', { name: /language/i })).toBeInTheDocument();
  });

  it('closes the sheet and navigates when an item is chosen', async () => {
    renderAt('/');
    await userEvent.click(within(tabBar()).getByRole('button', { name: 'More' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Progress' }));
    expect(screen.getByTestId('path')).toHaveTextContent('/progress');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the sheet on Escape', async () => {
    renderAt('/');
    await userEvent.click(within(tabBar()).getByRole('button', { name: 'More' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('logs out from the sheet', async () => {
    const onLogout = vi.fn();
    renderAt('/', undefined, onLogout);
    await userEvent.click(within(tabBar()).getByRole('button', { name: 'More' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /log ?out/i }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('shows admin pages in More only for admins', async () => {
    renderAt('/', { full_name: 'Admin', is_admin: true });
    await userEvent.click(within(tabBar()).getByRole('button', { name: 'More' }));
    const sheet = screen.getByRole('dialog');
    expect(within(sheet).getByRole('button', { name: 'Admin' })).toBeInTheDocument();
    expect(within(sheet).getByRole('button', { name: 'Impact' })).toBeInTheDocument();
  });
});
