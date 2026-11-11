// End-to-end smoke test against a running frontend and backend, on a throwaway
// database. Runs on every pull request (.github/workflows/e2e.yml). Locally:
//   CHROME_PATH=/path/to/chrome node e2e/smoke.js
import { chromium } from 'playwright';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:4173';
const API = process.env.E2E_API_URL || 'http://localhost:8765';
const RUN = String(Date.now()).slice(-7);
const failures = [];
let passed = 0;

const check = (name, ok, detail = '') => {
  if (ok) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failures.push(name);
    console.log(`FAIL  ${name}${detail ? ` (${detail})` : ''}`);
  }
};

const account = { password: 'password123', country: 'GH', consent_confirmed: true, guardian_email: 'g@test.com' };

const register = async (request, body) => {
  const response = await request.post(`${API}/api/auth/register`, { data: { ...account, ...body } });
  if (!response.ok()) throw new Error(`register failed: ${await response.text()}`);
  return response.json();
};

const signIn = async (page, data) => {
  await page.goto(BASE);
  await page.evaluate((d) => {
    localStorage.setItem('pathwaygh_token', d.token);
    localStorage.setItem('pathwaygh_user', JSON.stringify(d.user));
    localStorage.setItem('pathwaygh_country', d.user.country);
  }, data);
};

const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const errors = [];

try {
  const desktop = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });

  const jhs = await register(desktop.request, { email: `j${RUN}@test.com`, full_name: 'Ama Mensah', level: 'jhs', grade: 'JHS 3' });
  const shs = await register(phone.request, { email: `s${RUN}@test.com`, full_name: 'Yaw Boateng', level: 'shs', grade: 'SHS 2' });

  // --- Public landing page
  const landing = await desktop.newPage();
  landing.on('pageerror', (e) => errors.push(String(e)));
  await landing.goto(BASE);
  await landing.getByRole('button', { name: /get started/i }).first().waitFor();
  check('landing page never mentions certificates', !/certificate/i.test(await landing.locator('body').innerText()));

  // --- Policy pages open for anyone, signed out, straight from their address
  for (const [path, heading] of [['/terms', 'Terms of Service'], ['/refunds', 'Refund Policy'], ['/contact', 'Contact us'], ['/privacy', 'Privacy Policy']]) {
    await landing.goto(`${BASE}${path}`);
    const shown = await landing.getByRole('heading', { level: 1, name: heading }).isVisible().catch(() => false)
      || await landing.getByRole('heading', { level: 1, name: heading }).waitFor({ timeout: 8000 }).then(() => true, () => false);
    check(`${path} opens signed out`, shown);
  }
  await landing.goto(BASE);
  await landing.getByRole('link', { name: 'Refunds' }).click();
  await landing.getByRole('heading', { level: 1, name: 'Refund Policy' }).waitFor();
  check('the landing page links to the Refund Policy', true);

  // --- Desktop menu and Profile
  const page = await desktop.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  await signIn(page, jhs);
  await page.goto(`${BASE}/`);
  const nameLink = page.getByRole('link', { name: /Ama Mensah/ }).first();
  await nameLink.waitFor();
  const nav = page.locator('nav').first();
  const labels = (await nav.getByRole('button').allInnerTexts()).concat(await nav.getByRole('link').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  check('menu keeps the agreed order', labels.join() === 'Home,Plan,Learn,Practice,Flashcards,Progress,Explore,Community', labels.join());
  await nameLink.click();
  await page.waitForURL('**/profile');
  check('the name in the header opens Profile', true);

  // --- School Selection
  await page.goto(`${BASE}/explore`);
  await page.getByRole('button', { name: /plan my choices/i }).click();
  await page.waitForURL('**/explore/school-selection');
  await page.getByRole('heading', { name: 'The 2026 rules' }).waitFor();
  check('School Selection opens from Explore', true);

  // --- Privacy on a shared device: signed-in data must not be stored
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.getByRole('heading', { name: 'The 2026 rules' }).waitFor();
  await page.goto(`${BASE}/profile`);
  await page.getByRole('link', { name: /Ama Mensah/ }).first().waitFor();
  await page.waitForTimeout(1500);
  const stored = await page.evaluate(async () => {
    const urls = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      urls.push(...(await cache.keys()).map((r) => r.url));
    }
    return urls.filter((url) => new URL(url).pathname.startsWith('/api/') && !new URL(url).pathname.startsWith('/api/explore/'));
  });
  check('no signed-in API response is stored on the device', stored.length === 0, stored.slice(0, 3).join(', '));

  // --- Text-size setting really changes the text
  const sizeOf = () => page.evaluate(() => {
    const el = [...document.querySelectorAll('nav button, nav a')][1];
    return parseFloat(getComputedStyle(el).fontSize);
  });
  const normal = await sizeOf();
  await page.evaluate(() => document.documentElement.setAttribute('data-text-scale', 'larger'));
  const larger = await sizeOf();
  check('the larger text setting scales hard-to-reach text', larger >= normal * 1.2, `${normal}px to ${larger}px`);
  await page.evaluate(() => document.documentElement.setAttribute('data-text-scale', 'normal'));

  // --- Practice labels
  await page.goto(`${BASE}/practice`);
  await page.getByText(/BECE practice questions/).waitFor();
  check('JHS practice says BECE practice questions', true);

  // --- Phone
  const mobile = await phone.newPage();
  mobile.on('pageerror', (e) => errors.push(String(e)));
  await signIn(mobile, shs);
  await mobile.goto(`${BASE}/`);
  const phoneProfile = mobile.getByRole('link', { name: /Yaw Boateng/ });
  await phoneProfile.waitFor();
  check('the name is visible at the top on a phone', await phoneProfile.isVisible());
  await phoneProfile.click();
  await mobile.waitForURL('**/profile');
  check('tapping the name on a phone opens Profile', true);

  await mobile.goto(`${BASE}/practice`);
  await mobile.getByText(/WASSCE practice questions/).waitFor();
  check('SHS practice in Ghana says WASSCE practice questions', true);
  const tabs = (await mobile.locator('.mobile-tabbar button').allInnerTexts()).map((text) => text.trim());
  check('phone bar is Home, Plan, Learn, Practice, More', tabs.join() === 'Home,Plan,Learn,Practice,More', tabs.join());

  const nigeria = await phone.newPage();
  await signIn(nigeria, await register(phone.request, { email: `n${RUN}@test.com`, full_name: 'Tunde Ade', country: 'NG', level: 'shs', grade: 'SHS 1' }));
  await nigeria.goto(`${BASE}/practice`);
  await nigeria.getByText(/SSCE practice questions/).waitFor();
  check('SHS practice in Nigeria says SSCE practice questions', !(await nigeria.locator('body').innerText()).includes('WASSCE practice'));
  await nigeria.close();

  for (const scale of ['normal', 'larger']) {
    for (const route of ['/', '/learn', '/practice', '/plan', '/explore', '/flashcards', '/progress', '/community', '/profile']) {
      await mobile.goto(`${BASE}${route}`);
      await mobile.evaluate((s) => document.documentElement.setAttribute('data-text-scale', s), scale);
      await mobile.waitForTimeout(600);
      const extra = await overflow(mobile);
      check(`${route} fits a phone at ${scale} text`, extra <= 0, `${extra}px too wide`);
    }
  }

  // --- A school-issued password has to be replaced before anything else
  const head = await register(desktop.request, { email: `h${RUN}@test.com`, full_name: 'Head Teacher', level: 'shs' });
  const auth = { Authorization: `Bearer ${head.token}` };
  await desktop.request.post(`${API}/api/school/create`, { headers: auth, data: { name: 'Demo School', country: 'GH' } });
  await desktop.request.patch(`${API}/api/school/consent`, { headers: auth, data: { attested: true } });
  const issued = await desktop.request.post(`${API}/api/school/students`, { headers: auth, data: { students: [{ full_name: `Esi Addo${RUN}`, grade: 'Primary 3' }] } });
  const pupil = (await issued.json()).students[0];
  const login = await desktop.request.post(`${API}/api/auth/login`, { data: { identifier: pupil.username, password: pupil.temporary_password } });
  const session = await login.json();
  const blocked = await desktop.request.get(`${API}/api/profile/me`, { headers: { Authorization: `Bearer ${session.token}` } });
  check('the server blocks a temporary-password session', blocked.status() === 403, `status ${blocked.status()}`);
  const pupilPage = await desktop.newPage();
  pupilPage.on('pageerror', (e) => errors.push(String(e)));
  await signIn(pupilPage, session);
  await pupilPage.goto(`${BASE}/`);
  await pupilPage.getByRole('heading', { name: /choose your own password/i }).waitFor();
  await pupilPage.getByLabel('Password from your school').fill(pupil.temporary_password);
  await pupilPage.getByLabel('New password', { exact: true }).fill('mynewpass1');
  await pupilPage.getByLabel('New password again').fill('mynewpass1');
  await pupilPage.getByRole('button', { name: /save my password/i }).click();
  await pupilPage.getByRole('heading', { name: /choose your own password/i }).waitFor({ state: 'detached' });
  check('after changing it, the app opens', true);

  check('no uncaught page errors', errors.length === 0, errors.join(' | ').slice(0, 300));
} catch (error) {
  failures.push(String(error).slice(0, 500));
  console.log(`CRASH ${String(error).slice(0, 500)}`);
} finally {
  await browser.close();
}

console.log(`\n${passed} passed, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
