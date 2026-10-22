// Single source of truth for app navigation, shared by the desktop top bar
// (EcosystemNavigation) and the phone tab bar (MobileTabBar) so the two
// can't drift apart.
import { useLocation } from 'react-router-dom';
import {
  BarChart3, BookOpen, Building2, Home, Layers, ListChecks, PencilLine, Search, Shield, Trophy, User, Users,
} from 'lucide-react';

// `primary` items are the phone tab bar's direct tabs; the rest live under "More".
export const getNavItems = (user, t) => [
  { id: 'home', icon: Home, label: t('navHome'), path: '/', primary: true },
  { id: 'learn', icon: BookOpen, label: t('navLearn'), path: '/learn', primary: true },
  { id: 'practice', icon: PencilLine, label: t('navPractice'), path: '/practice', primary: true },
  { id: 'explore', icon: Search, label: t('navExplore'), path: '/explore', primary: true },
  { id: 'flashcards', icon: Layers, label: t('navFlashcards'), path: '/flashcards' },
  { id: 'plan', icon: ListChecks, label: t('navPlan'), path: '/plan' },
  { id: 'progress', icon: Trophy, label: t('navProgress'), path: '/progress' },
  { id: 'profile', icon: User, label: t('navProfile'), path: '/profile' },
  { id: 'community', icon: Users, label: t('navCommunity'), path: '/community' },
  ...(user?.is_admin ? [{ id: 'admin', icon: Shield, label: t('navAdmin'), path: '/admin' }] : []),
  ...(user?.is_admin ? [{ id: 'impact', icon: BarChart3, label: t('navImpact'), path: '/impact' }] : []),
  ...(user?.is_school_admin ? [{ id: 'school-admin', icon: Building2, label: t('navSchoolAdmin'), path: '/school-admin' }] : []),
];

// The active item is derived from the URL, not remembered from the last
// click - deep links, refreshes, the back button and in-page links all stay
// correct. Longest matching path wins, so /learn/x/lessons/y -> Learn and
// "/" only matches the home page itself.
export const useActiveNavId = (items) => {
  const { pathname } = useLocation();
  const isOnPath = (path) =>
    path === '/' ? pathname === '/' || pathname === '/home' : pathname === path || pathname.startsWith(`${path}/`);
  return items
    .filter((item) => isOnPath(item.path))
    .sort((a, b) => b.path.length - a.path.length)[0]?.id;
};
