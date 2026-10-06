# PathwayGH backend on a Namecheap VPS (Pulsar)

Target: `https://api.learninghotspot.africa` (backend API)
Frontend: stays on Namecheap shared hosting (Stellar plan, `learninghotspot.africa`).
Database: stays on Neon (Postgres). Nothing in this runbook changes the database.

Work through the steps in order. Keep Render running until step 9 is finished and verified.

## Before you start (you)

1. **Rotate the Neon database password.** The connection string was pasted into a chat, so treat it as exposed. Change it in the Neon dashboard, and keep the new string in a password manager. Never paste it into chat, a commit or a log.
2. Buy the **Pulsar** VPS in Namecheap. Choose **Ubuntu 24.04 LTS**, with no control panel. Note the server's IP address.
3. In Namecheap, open the DNS settings for `learninghotspot.africa` and add an **A record**: host `api`, value = the VPS IP address, TTL automatic. The DNS change can take up to an hour to spread.

## 1. First login and hardening (on the server)

```bash
ssh root@<VPS_IP>                       # use the SSH key or root password from Namecheap
adduser --disabled-password --gecos "" pathway
usermod -aG sudo pathway
rsync --archive --chown=pathway:pathway ~/.ssh /home/pathway   # copy your SSH key to the new user
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
apt update && apt -y upgrade
apt -y install nginx certbot python3-certbot-nginx git fail2ban
```

Log out, then log in as `pathway` (`ssh pathway@<VPS_IP>`) for the rest of the steps. Use `sudo` where needed.

## 2. Python 3.11 and the code

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh && source ~/.local/bin/env
uv python install 3.11
sudo mkdir -p /opt/pathwaygh && sudo chown pathway:pathway /opt/pathwaygh
git clone --branch main https://github.com/ZziemWellu/pathwaygh-mvp.git /opt/pathwaygh
cd /opt/pathwaygh/backend
uv venv --python 3.11 venv
source venv/bin/activate
pip install -r requirements.txt
```

## 3. Environment file (secrets)

Create `/etc/pathwaygh/api.env` with the variables listed in `env.example`. Use the values from your Render dashboard (Environment tab). Copy them across yourself; don't send them to anyone.

```bash
sudo mkdir -p /etc/pathwaygh && sudo nano /etc/pathwaygh/api.env
sudo chmod 600 /etc/pathwaygh/api.env && sudo chown pathway:pathway /etc/pathwaygh/api.env
```

Set `FRONTEND_URL` to the frontend's public address (see step 9). Until the frontend is moved, use the current Render value.

## 4. Database migrations (once, before the first start)

```bash
cd /opt/pathwaygh/backend && source venv/bin/activate
set -a && source /etc/pathwaygh/api.env && set +a
alembic upgrade head
```

## 5. Run as a service

```bash
sudo cp /opt/pathwaygh/deploy/vps/pathwaygh-api.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now pathwaygh-api
curl -fsS http://127.0.0.1:8000/health && echo " <- local health OK"
```

## 6. Reverse proxy and HTTPS

```bash
sudo cp /opt/pathwaygh/deploy/vps/nginx-api.conf /etc/nginx/sites-available/pathwaygh-api
sudo ln -s /etc/nginx/sites-available/pathwaygh-api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.learninghotspot.africa --redirect --agree-tos -m <YOUR_EMAIL>
curl -fsS https://api.learninghotspot.africa/health && echo " <- public health OK"
```

Certbot renews the certificate automatically.

## 7. Uploaded avatars

Avatars are saved to `backend/uploads/avatars` on the server's disk. Unlike Render's free disk, this disk persists. Back it up nightly:

```bash
sudo crontab -u pathway -e
# add:  30 2 * * *  rsync -a /opt/pathwaygh/backend/uploads/ /home/pathway/backups/uploads/
```

## 8. Updating the app

`/opt/pathwaygh/deploy/vps/deploy.sh` pulls `main`, installs requirements, runs migrations and restarts the service:

```bash
/opt/pathwaygh/deploy/vps/deploy.sh
```

## 9. Frontend, CORS and cutover

1. **Frontend:** rebuild the site with the new API address. In `frontend/.env.production` set `VITE_API_URL=https://api.learninghotspot.africa`, run `npm run build`, and upload the new `dist` folder to Namecheap (overwrite the old files, keep `.htaccess`).
2. **CORS:** set `FRONTEND_URL` in `/etc/pathwaygh/api.env` to the frontend's exact address (for example `https://learninghotspot.africa`, or the subdomain you use). Restart with `sudo systemctl restart pathwaygh-api`. Payments also redirect to this address.
3. **Scheduled jobs:** the GitHub Actions workflows `keep-backend-warm`, `monitor-health`, `parent-digest` and `practice-sms` call the Render address. Change `pathwaygh-backend.onrender.com` to `api.learninghotspot.africa` in each file (as a pull request), and disable `keep-backend-warm`, which is not needed on the VPS. The `backup-database` workflow should be checked too.
4. **Verify** the whole site: sign-in, a course page, a practice quiz, a payment test and an avatar upload.
5. **Keep Render for one week** as a fallback, then suspend the Render services.

## Rollback

If anything fails after cutover, point the frontend back to the Render backend (`VITE_API_URL=https://pathwaygh-backend.onrender.com`), rebuild and re-upload. Render keeps running until step 9.5.

## Hackathon timing (suggested)

- Week 1: buy the VPS, rotate the database password, steps 1–5 (server running on the IP address).
- Week 2: steps 6–8, then test the full site on `api.learninghotspot.africa` while Render stays live.
- Week 3: cutover (step 9), then one week of monitoring before the hackathon.
- Keep the Render paid plan (Starter) as the fallback until the cutover is proven.
