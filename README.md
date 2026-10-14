# EMPLOIDIRECT.CA

Plateforme d'emploi francophone, développée pour **GROUPE TAKATAK**. Version initiale fonctionnelle : recherche d'offres, filtres, favoris locaux, comptes employeurs, offres en brouillon/publication après vérification, réception des candidatures et retrait autonome d'une candidature.

> **État au 14 octobre 2026 :** socle MVP, pas un lancement commercial complet. Le dépôt ne contenait initialement qu'un README. Aucune offre réelle n'est créée artificiellement. Voir [ROADMAP.md](ROADMAP.md) et [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md).

## Développer localement

Nécessite **Node.js 22+**.

```bash
npm install
npm run dev
```

Ouvrir **http://localhost:5173**. Vite sert l'interface, Express sert `/api` sur `http://localhost:3001`.

```bash
npm run check  # tests API + vérification TypeScript + build frontend
npm run build  # frontend dans dist/
PORT=3001 NODE_ENV=development node server/index.js
```

Pour une exécution locale persistante : créer `.env` à partir de `.env.example`, puis utiliser `node --env-file=.env server/index.js`. `npm start` lit les variables de l'environnement fourni par l'hébergeur et **ne charge pas automatiquement `.env`**.

## Parcours fonctionnels

1. Un employeur crée un compte avec un mot de passe de 12 caractères minimum, puis se connecte.
2. Il prépare des offres en brouillon. La publication est bloquée jusqu'à ce que l'entreprise soit vérifiée par l'administrateur.
3. Dans le répertoire de données persistant du serveur, l'administrateur vérifie l'identité de l'entreprise **hors plateforme** puis exécute `npm run approve:employer -- adresse@entreprise.ca`.
4. L'employeur publie, modifie ou retire ses propres offres. Modifier une offre publiée la remet en brouillon.
5. Les candidats recherchent les offres publiées, sauvegardent des favoris dans leur navigateur et postulent. Ils reçoivent un lien privé de retrait à conserver.
6. Chaque employeur ne consulte que les candidatures liées à **ses** offres.

Les candidatures ne déclenchent **pas encore de courriel**. L'employeur doit consulter son tableau de bord. Les données de candidature expirées (180 jours) sont purgées au démarrage, toutes les 24 heures et à chaque écriture. Avant lancement, prévoir les sauvegardes, le contact légal et un suivi opérationnel de la purge.

## API principales

| Méthode | Chemin | Accès |
| --- | --- | --- |
| GET | `/api/health` | Public |
| GET | `/api/meta` | Public |
| GET | `/api/jobs?q=&location=&category=&type=&mode=&page=` | Public |
| GET | `/api/jobs/:id` | Public (publiées) |
| POST | `/api/auth/register` | Public (compte employeur) |
| POST | `/api/auth/login` et `/api/auth/logout` | Public/session |
| GET | `/api/auth/me` | Session |
| GET/POST | `/api/employer/jobs` | Employeur |
| PUT | `/api/employer/jobs/:id` | Propriétaire |
| POST | `/api/employer/jobs/:id/publish` et `/unpublish` | Propriétaire approuvé |
| GET | `/api/employer/applications` | Employeur (ses offres) |
| POST | `/api/jobs/:id/applications` | Public (offre publiée) |
| POST | `/api/applications/withdraw` | Lien privé |

## Architecture

- **Client** : React 18 + TypeScript + Vite, interface responsive FR-CA.
- **API** : Node.js 22 + Express, sessions opaques HTTP-only, hachage `scrypt`, protection d'origine et limitation de débit basique.
- **Stockage v1** : fichier JSON atomique sur disque local, **un seul processus Node**. `DATA_DIR` doit être **persistant, sauvegardé et hors du répertoire public**. Pas adapté à un déploiement multi-instance ni aux très fortes charges : migrer vers PostgreSQL et des services métier centralisés avant la montée en puissance.
- **Isolation** : les ressources sont indexées par propriétaire côté serveur. Ne pas confondre ce contrôle local avec une fédération d'identité TAKATAK déjà opérationnelle. L'intégration TAKATAK Auth/tenant-scoped API reste à construire.

## Aperçu Render en lecture seule

Une prévisualisation éventuelle peut être publiée sur Render avec `PREVIEW_READ_ONLY=true` (serveur) et `VITE_PREVIEW_ONLY=true` (build). Les écritures API sont alors refusées et le parcours employeur désactivé dans l'interface. **Ne jamais** permettre la saisie de candidatures sur une instance à stockage non persistant.

## Conditions de mise en production

Le workflow CI exécute les validations, puis compile hors serveur. Le workflow de déploiement MochaHost s'active **uniquement** lorsque les secrets et variables attendus sont configurés ; il ne construit pas sur cPanel. Les étapes d'activation et les points bloquants sont décrits dans [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md).
