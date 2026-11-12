# AxynWeb — plateforme du studio

Une seule application qui regroupe :

- **le site vitrine** (`/`) : thème clair, fond 3D WebGL qui avance au défilement, galerie de modèles, simulateur de devis ;
- **quatre modèles de sites** (`/modeles`) : Aurore, Monolithe, Pulse, Atelier — fond 3D animé, cadres photo, infos pratiques ;
- **l'espace client** (`/client`) : textes et photos en direct avec aperçu ordinateur/mobile, avancement du site, demandes de modification, domaines, export et suppression des données ;
- **l'espace admin** (`/admin`) : création de site guidée (`/admin/sites/nouveau`), publication en un clic, clients, briefs, demandes (Kanban), domaines, prospects, journal d'activité ;
- **un serveur MCP** (`/api/mcp`) : Claude crée et modifie les sites directement.

## Démarrer

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000. Les identifiants de l'administrateur et du client de démonstration sont dans `.env.local` (jamais versionné). Ils sont créés au premier démarrage, quand la base est vide.

## Brancher Claude

1. Se connecter en admin, ouvrir **Claude (MCP)**, générer un jeton.
2. Dans un terminal :

```bash
claude mcp add --transport http axynweb http://localhost:3000/api/mcp --header "Authorization: Bearer VOTRE_JETON"
```

3. Demander par exemple : « Crée un site pour la boulangerie Dupont avec le modèle Aurore », ou « Génère les sites des briefs en attente ».

Deux façons de créer un site :

| Mode | Outil MCP | Résultat |
| --- | --- | --- |
| Depuis un modèle | `create_site_from_template` | Claude rédige le contenu, le client peut ensuite l'éditer lui-même |
| Depuis un brief | `create_custom_site`, `set_site_html` | Claude génère une page HTML complète, servie dans un bac à sable isolé |

## Organisation du code

| Dossier | Rôle |
| --- | --- |
| `src/lib/config.ts` | Nom, coordonnées, mentions légales, tarifs — **à compléter** |
| `src/lib/templates.ts` | Définition des modèles et des champs éditables |
| `src/components/Scene3D.tsx` | Fonds 3D des modèles (three.js + shaders) : `silk`, `waves`, `grid` |
| `src/components/ParticleStage.tsx` | Scène de l'accueil : particules qui changent de forme par section (attributs `data-stage-*`) et fond de page animé |
| `src/components/ScrollFX.tsx` | Animations de défilement par attributs `data-*` |
| `src/components/templates/` | Mise en page des quatre modèles |
| `src/lib/data.ts` | Règles métier, partagées par l'admin et le serveur MCP |
| `src/lib/mcp-tools.ts` | Outils exposés à Claude |
| `src/lib/db.ts`, `src/lib/auth.ts` | Base SQLite (`data/webcrea.db`), sessions, limitation de débit |
| `src/lib/media.ts` | Photos des clients (`data/uploads`), type vérifié par signature binaire |
| `src/app/globals.css` | Thème : couleurs en variables CSS, zones `.zone-dark` et `.zone-accent` |
| `public/previews` | Captures des modèles affichées dans la galerie et l'assistant |
| `src/proxy.ts` | Content-Security-Policy avec nonce, redirection des espaces privés |

Ajouter un modèle : une entrée dans `templates.ts` et une mise en page dans `TemplateSite.tsx`.

## Sécurité

- Mots de passe hachés avec scrypt ; jetons de session et d'API stockés sous forme d'empreinte SHA-256.
- Cookie de session `HttpOnly`, `SameSite=Lax`, `Secure` en production.
- Rôle revérifié côté serveur dans chaque page et chaque action ; un client ne voit que ses sites.
- Requêtes SQL préparées, entrées validées, limitation de débit sur la connexion, les formulaires et le MCP.
- En-têtes : CSP stricte avec nonce, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Les pages HTML sur-mesure sont servies avec une CSP `sandbox` : origine isolée, aucun accès aux cookies ni aux API.

## Conformité européenne

- Aucun traceur, aucune police ou ressource tierce : seul un cookie de session, exempté de consentement.
- Consentement explicite sur le formulaire de devis ; export JSON et demande d'effacement dans l'espace client.
- Pages : mentions légales, confidentialité, CGV, accessibilité.
- Animations coupées avec `prefers-reduced-motion`, navigation clavier, lien d'évitement.

## Avant la mise en ligne

Pas-à-pas complet pour un serveur Hetzner (Node, Caddy, service, sauvegardes) : [DEPLOIEMENT.md](DEPLOIEMENT.md).

1. Compléter `src/lib/config.ts` (raison sociale, SIRET, hébergeur, e-mail, tarifs).
2. Faire relire les CGV par un juriste et désigner un médiateur de la consommation.
3. Choisir un hébergement dans l'Union européenne avec disque persistant (VPS) : la base est un fichier SQLite et les photos sont des fichiers. Mettre en place une sauvegarde de `data/`.
4. Servir en HTTPS derrière un reverse proxy qui transmet `X-Forwarded-For` et `X-Forwarded-Proto`.
5. Changer les mots de passe de `.env.local`, supprimer le client de démonstration.
6. Brancher l'envoi d'e-mails (notification de devis, remise des identifiants) : non inclus.
7. Relier les noms de domaine des clients à leurs sites (`/s/<slug>`) : routage par nom d'hôte à ajouter.
