# Mettre AxynWeb en ligne sur un serveur Hetzner

Pourquoi pas Vercel : l'app garde sa base SQLite (`data/webcrea.db`) et les photos des clients (`data/uploads/`) dans des fichiers. Vercel efface son disque à chaque déploiement. Il faut un serveur avec un disque qui persiste, et Hetzner en propose en Allemagne et en Finlande (Union européenne).

Dans ce guide, remplace :

| Texte | Par |
| --- | --- |
| `exemple.fr` | ton vrai nom de domaine |
| `IP_DU_SERVEUR` | l'adresse IP donnée par Hetzner |

Durée : environ une heure la première fois. Coût : l'offre CX23 (2 vCPU, 4 Go) était annoncée vers 5,49 à 5,99 € HT par mois après la hausse de juin 2026, plus environ 20 % pour l'option Backups. Les prix changent : vérifie dans le configurateur de la console Hetzner avant de commander.

---

## 1. Créer le serveur

1. Créer un compte sur https://console.hetzner.cloud, puis un projet.
2. **Ajouter un serveur** :
   - **Emplacement** : Falkenstein, Nuremberg ou Helsinki (jamais un site hors UE : le README exige l'UE).
   - **Image** : Ubuntu 24.04.
   - **Type** : une petite offre « Shared vCPU » avec **au moins 4 Go de RAM** (la compilation de Next.js a besoin de mémoire).
   - **Réseau** : laisser IPv4 et IPv6.
   - **Clé SSH** : ajoute la tienne (voir ci-dessous).
   - **Sauvegardes** : active l'option « Backups » (environ 20 % de plus). C'est une sécurité en plus du point 10.
3. Si tu n'as pas de clé SSH, dans PowerShell sur ton PC :

```powershell
ssh-keygen -t ed25519 -C "axynweb"
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
```

Colle la ligne affichée (elle commence par `ssh-ed25519`) dans Hetzner. Ne partage jamais l'autre fichier, `id_ed25519`, sans `.pub`.

## 2. Pointer le domaine vers le serveur

Chez le gestionnaire du domaine (OVH, Gandi, Vercel…), crée deux enregistrements DNS :

| Type | Nom | Valeur |
| --- | --- | --- |
| A | `@` | `IP_DU_SERVEUR` |
| A | `www` | `IP_DU_SERVEUR` |

Si ton domaine est chez Vercel : *Domains → exemple.fr → DNS Records*. Supprime les anciens enregistrements `@` et `www` qui pointent vers Vercel. La propagation prend de quelques minutes à quelques heures.

## 3. Sécuriser le serveur

Connexion :

```powershell
ssh root@IP_DU_SERVEUR
```

Puis, sur le serveur :

```bash
apt update && apt upgrade -y

# Utilisateur qui fera tourner l'app (sans accès administrateur)
adduser --disabled-password --gecos "" axyn

# Ton propre compte d'administration, avec la même clé SSH
adduser --gecos "" admin
usermod -aG sudo admin
mkdir -p /home/admin/.ssh && cp /root/.ssh/authorized_keys /home/admin/.ssh/
chown -R admin:admin /home/admin/.ssh && chmod 700 /home/admin/.ssh && chmod 600 /home/admin/.ssh/authorized_keys

# Pare-feu : seuls SSH, HTTP et HTTPS sont ouverts
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable
```

Teste dans un **autre terminal** que `ssh admin@IP_DU_SERVEUR` fonctionne. Seulement ensuite, ferme l'accès root par mot de passe :

```bash
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/; s/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh
```

Reconnecte-toi désormais avec `ssh admin@IP_DU_SERVEUR` (les commandes suivantes utilisent `sudo`).

## 4. Installer Node, Caddy et SQLite

```bash
# Node 24 (l'app utilise le module SQLite intégré, Node 22.5 minimum)
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs git sqlite3

# Caddy : reverse proxy qui obtient et renouvelle le certificat HTTPS tout seul
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy

node -v    # doit afficher v24.x
```

## 5. Récupérer le code

Le dépôt `RobBtn/AxynWeb` est privé ou public ? S'il est privé, le serveur a besoin d'une clé en lecture seule :

```bash
sudo -u axyn ssh-keygen -t ed25519 -f /home/axyn/.ssh/id_ed25519 -N "" -C "deploy-axynweb"
sudo cat /home/axyn/.ssh/id_ed25519.pub
```

Sur GitHub : dépôt **AxynWeb → Settings → Deploy keys → Add deploy key**, colle la clé, **ne coche pas** « Allow write access ».

Puis :

```bash
sudo mkdir -p /srv/axynweb && sudo chown axyn:axyn /srv/axynweb
sudo -u axyn git clone git@github.com:RobBtn/AxynWeb.git /srv/axynweb
# (dépôt public : https://github.com/RobBtn/AxynWeb.git, sans clé)
```

À la première connexion GitHub, réponds `yes` à la question sur l'empreinte.

## 6. Configurer et compiler

```bash
sudo -u axyn nano /srv/axynweb/.env.local
```

Contenu (mots de passe **nouveaux et longs**, différents de ceux utilisés sur ton PC) :

```
ADMIN_EMAIL=ton-adresse@exemple.fr
ADMIN_PASSWORD=un-mot-de-passe-long-et-unique
# Pas de DEMO_CLIENT_* en production : sinon un faux client est créé.
# Clé API Claude (console.anthropic.com), pour le bouton IA de l'admin. Facultatif.
ANTHROPIC_API_KEY=

# E-mails (code de vérification à l'inscription). Voir « Envoyer des e-mails » plus bas.
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=AxynWeb <contact@exemple.fr>
```

> **Sans réglages SMTP, les inscriptions publiques sont fermées en production.** C'est voulu : l'app refuse de créer des comptes dont l'adresse n'a pas été vérifiée par un code. Le site fonctionne normalement pour le reste, et l'admin peut toujours créer des comptes depuis « Utilisateurs ». Pour fermer volontairement les inscriptions, ajoute `SIGNUP_OPEN=false`.

> Le compte admin n'est créé **qu'au premier démarrage, quand la base est vide**. Changer `ADMIN_PASSWORD` plus tard dans ce fichier ne change pas le mot de passe : il faudra le changer depuis l'app.

```bash
sudo chmod 600 /srv/axynweb/.env.local
cd /srv/axynweb
sudo -u axyn npm ci
sudo -u axyn npm run build
```

## 7. Lancer l'app en service

```bash
sudo nano /etc/systemd/system/axynweb.service
```

```ini
[Unit]
Description=AxynWeb
After=network.target

[Service]
User=axyn
WorkingDirectory=/srv/axynweb
Environment=NODE_ENV=production
# 127.0.0.1 : l'app n'est joignable que par Caddy (voir l'encadré plus bas).
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3000
Restart=always
RestartSec=3
NoNewPrivileges=true
ProtectSystem=full
ReadWritePaths=/srv/axynweb

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now axynweb
sudo systemctl status axynweb --no-pager
curl -I http://127.0.0.1:3000     # doit répondre HTTP/1.1 200
```

> **Pourquoi `-H 127.0.0.1` est important.** L'app lit l'adresse IP des visiteurs dans l'en-tête `X-Forwarded-For` pour limiter les tentatives de connexion. Si l'app était joignable directement, n'importe qui pourrait écrire cet en-tête lui-même et contourner la limite. Derrière Caddy, c'est Caddy qui le renseigne.
>
> Le dossier de travail compte aussi : l'app range ses données dans `data/` **par rapport au dossier courant**. Le service doit toujours démarrer dans `/srv/axynweb`.

## 8. Mettre le site en HTTPS avec Caddy

```bash
sudo nano /etc/caddy/Caddyfile
```

Remplace tout le contenu par :

```
exemple.fr {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3000
}

www.exemple.fr {
    redir https://exemple.fr{uri} permanent
}
```

```bash
sudo systemctl reload caddy
```

Caddy demande le certificat à Let's Encrypt tout seul, dès que le DNS du point 2 est propagé. Ouvre `https://exemple.fr`. Si ça échoue : `sudo journalctl -u caddy -n 50 --no-pager`.

Utilise toujours `https://`. Le cookie de connexion est marqué `Secure` en production : en `http://`, tu ne pourrais pas te connecter.

## 9. Premières vérifications

1. Ouvre `https://exemple.fr/connexion` et connecte-toi avec `ADMIN_EMAIL` et `ADMIN_PASSWORD`.
2. Contrôle que la base existe : `ls -l /srv/axynweb/data/`.
3. Teste l'envoi d'une photo dans l'espace d'un client (limite de 5 Mo).

## 10. Sauvegardes (ne saute pas cette étape)

Tout ce qui compte est dans `data/` : la base et les photos. Copier simplement le fichier de la base pendant qu'il est utilisé peut donner une copie corrompue (mode WAL). On utilise donc la commande de sauvegarde de SQLite.

```bash
sudo nano /usr/local/bin/axynweb-backup
```

```bash
#!/bin/bash
set -euo pipefail
DEST=/var/backups/axynweb
STAMP=$(date +%F)
mkdir -p "$DEST"

# Copie cohérente de la base, même pendant que l'app tourne
sqlite3 /srv/axynweb/data/webcrea.db ".backup '$DEST/webcrea-$STAMP.db'"
# Photos des clients
tar -czf "$DEST/uploads-$STAMP.tar.gz" -C /srv/axynweb/data uploads

# Garde 14 jours
find "$DEST" -type f -mtime +14 -delete
```

```bash
sudo chmod +x /usr/local/bin/axynweb-backup
echo '0 3 * * * root /usr/local/bin/axynweb-backup' | sudo tee /etc/cron.d/axynweb-backup
sudo /usr/local/bin/axynweb-backup && ls -l /var/backups/axynweb
```

Ces copies sont **sur le même serveur** : elles ne te protègent pas si le serveur est perdu. Ajoute une copie ailleurs, au choix :

- l'option « Backups » de Hetzner du point 1 (images complètes du serveur) ;
- un **Storage Box** Hetzner ou un autre stockage, avec `rsync` ou `rclone`, pour copier `/var/backups/axynweb` chaque nuit.

**Restaurer** (service arrêté) :

```bash
sudo systemctl stop axynweb
sudo -u axyn cp /var/backups/axynweb/webcrea-AAAA-MM-JJ.db /srv/axynweb/data/webcrea.db
sudo rm -f /srv/axynweb/data/webcrea.db-wal /srv/axynweb/data/webcrea.db-shm
sudo -u axyn tar -xzf /var/backups/axynweb/uploads-AAAA-MM-JJ.tar.gz -C /srv/axynweb/data
sudo systemctl start axynweb
```

Fais un essai de restauration une fois, avant d'en avoir besoin.

## 11. Mettre à jour le site

Le trajet est toujours le même : **ton PC → GitHub → serveur**.

1. Sur ton PC, teste en local (`npm run dev`), puis vérifie que ça compile : `npm run build`.
2. Commite et envoie sur GitHub : `git add -A`, `git commit -m "..."`, `git push`.
3. Mets le serveur à jour, depuis ton PC, avec une seule commande :

```powershell
ssh -i $env:USERPROFILE\.ssh\axynweb_ed25519 admin@IP_DU_SERVEUR "sudo /usr/local/bin/axynweb-deploy"
```

Le script `axynweb-deploy` (installé sur le serveur) fait, dans l'ordre :

1. sauvegarde la base si le script de sauvegarde existe (étape 10) ;
2. récupère le code (`git pull`, sans fusion risquée) ;
3. installe les dépendances et compile ;
4. redémarre le service ;
5. vérifie que le site répond, et sinon affiche les journaux et la commande pour revenir en arrière.

S'il n'y a rien de nouveau sur GitHub, il s'arrête sans rien compiler. Il refuse aussi de s'exécuter si `.env.local` est absent.

La compilation prend quelques minutes sur un seul processeur. Pendant ce temps, l'ancienne version continue de répondre, puis le site est coupé quelques secondes au redémarrage. Les nouvelles colonnes de base de données sont ajoutées automatiquement au démarrage.

> **Le serveur n'a pas ton `.env.local`** : il ne se met jamais à jour par GitHub. Si tu ajoutes un nouveau réglage (comme les `SMTP_*`), modifie aussi le fichier sur le serveur : `sudo -u axyn nano /srv/axynweb/.env.local`, puis `sudo systemctl restart axynweb`.

**Déploiement automatique à chaque push** (facultatif) : une GitHub Action peut lancer cette même commande par SSH dès que tu pousses sur `main`. Elle demande de stocker dans GitHub une clé qui donne accès au serveur, donc à ne faire que si tu en as vraiment besoin. Tant que tu veux relire ce que tu envoies en ligne, la commande manuelle est plus sûre.

## 12. Recharger tes prospects

La base du serveur est vide au départ. Pour y mettre la liste de prospection, depuis ton PC :

```powershell
scp "C:\Users\robin\Documents\Sites à refaire\Prospection Montauban-de-Bretagne\prospects-montauban-de-bretagne.csv" admin@IP_DU_SERVEUR:/tmp/prospects.csv
```

Puis sur le serveur :

```bash
cd /srv/axynweb
sudo -u axyn node --no-warnings scripts/import-prospects.mjs /tmp/prospects.csv
rm /tmp/prospects.csv
```

Le script ne duplique rien si tu le relances.

## 13. Reconnecter Claude (MCP)

1. Sur `https://exemple.fr/admin/mcp`, génère un jeton (il commence par `wc_` et n'est affiché qu'une fois).
2. Sur ton PC, dans le dossier du projet :

```powershell
claude mcp add --transport http axynweb-prod https://exemple.fr/api/mcp --header "Authorization: Bearer wc_TON_JETON"
```

Un jeton donne les pleins pouvoirs de l'admin sur le site. Ne le colle nulle part en public, et révoque-le dans l'admin s'il fuite.

## 14. Envoyer des e-mails (inscription par code)

L'app envoie un code à 6 chiffres par e-mail quand quelqu'un crée un compte. Il lui faut un **serveur SMTP**, c'est-à-dire un compte chez un service d'envoi ou une boîte mail de ton domaine. Tu en as besoin de :

| Réglage | Exemple |
| --- | --- |
| `SMTP_HOST` | l'adresse du serveur SMTP indiquée par ton fournisseur |
| `SMTP_PORT` | `587` (le plus courant, STARTTLS) ou `465` (TLS direct) |
| `SMTP_USER` / `SMTP_PASS` | l'identifiant et le mot de passe SMTP (souvent différents de ceux du compte) |
| `SMTP_FROM` | `AxynWeb <contact@axynweb.fr>` : l'adresse doit appartenir à ton domaine ou être autorisée par le service |

Pour que les messages n'arrivent pas dans les courriers indésirables, configure chez ton gestionnaire de domaine les enregistrements **SPF** et **DKIM** que ton fournisseur d'envoi t'indique, puis **DMARC**. Sans cela, beaucoup de messagers rejettent le code.

Après avoir rempli `.env.local` :

```bash
sudo systemctl restart axynweb
```

Pour tester, le plus simple : connecte-toi en admin, ouvre **Mon compte**, carte **Envoi d'e-mails**, et clique sur **Envoyer un e-mail de test**. Un message avec le logo arrive à ton adresse d'administrateur, ou la raison précise de l'échec s'affiche à l'écran. Tu peux aussi créer un compte sur `/inscription` avec une adresse à toi. Dans les deux cas, `sudo journalctl -u axynweb -n 50 --no-pager` détaille les erreurs (la ligne commence par `[axynweb] envoi du code impossible`).

Le logo est joint aux e-mails sous forme d'image PNG (`public/logo/axynweb-logo-1000.png`) : il s'affiche sans dépendre du site.

## 15. Avant d'ouvrir au public

- Compléter `src/lib/config.ts` : raison sociale, SIRET, hébergeur (Hetzner Online GmbH), e-mail, tarifs. Ces informations alimentent les mentions légales.
- Faire relire les CGV par un juriste et désigner un médiateur de la consommation.
- L'envoi d'e-mails sert aujourd'hui au code d'inscription. Les notifications de devis et la remise des identifiants ne sont pas encore envoyées par e-mail.
- Mentionner dans la politique de confidentialité la création de compte par inscription (nom, e-mail, mot de passe haché).
- Router les noms de domaine des clients vers leurs sites : pas encore fait, les sites sont servis sur `/s/<slug>`.

## En cas de problème

| Symptôme | Où regarder |
| --- | --- |
| Le site ne répond pas | `sudo systemctl status axynweb` puis `sudo journalctl -u axynweb -n 100 --no-pager` |
| Erreur de certificat | `sudo journalctl -u caddy -n 50 --no-pager` et vérifier que le DNS pointe bien vers le serveur |
| `502 Bad Gateway` | l'app est arrêtée : `sudo systemctl restart axynweb` |
| Connexion impossible | tu es sur `http://` au lieu de `https://`, ou le compte admin n'a pas été créé (base non vide au premier démarrage) |
| `npm run build` plante par manque de mémoire | prends une offre avec plus de RAM, ou ajoute un swap de 2 Go |
| Les données ont disparu après un déploiement | le service n'est pas lancé depuis `/srv/axynweb` : vérifier `WorkingDirectory` |
