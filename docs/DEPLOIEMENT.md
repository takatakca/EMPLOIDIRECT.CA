# Déploiement Node.js — EMPLOIDIRECT.CA

## Principe

Le dépôt est compilé par **GitHub Actions**, jamais par le terminal cPanel. L'artefact de production contient le serveur Node (`server/`), les métadonnées npm et le frontend compilé (`dist/`). Le serveur installe seulement les dépendances de production si nécessaire. **Un déploiement automatique nécessite un environnement prêt et des secrets GitHub.**

### Préparer le serveur

1. Créer le domaine et le certificat HTTPS dans cPanel. Activer une application Node.js **22** avec racine propre à EMPLOIDIRECT.CA (ne pas réutiliser le répertoire d'un autre site).
2. Configurer le fichier de démarrage `server/index.js` et le point d'entrée de l'application Node. Définir `NODE_ENV=production`, `PORT` conforme à l'hébergeur, `APP_ORIGIN=https://emploidirect.ca` et `DATA_DIR=/home/UTILISATEUR/emploidirect_data` dans l'environnement de l'application. N'activer `TRUST_PROXY=true` que si la configuration du proxy est maîtrisée.
3. Créer et sauvegarder le dossier `DATA_DIR` hors du dossier public, avec permissions restrictives. Ne jamais déplacer ou écraser la base `db.json` lors du déploiement.
4. Configurer dans GitHub les éléments suivants :

| Type | Nom | Utilité |
| --- | --- | --- |
| Secret | `EMPLOIDIRECT_SSH_PRIVATE_KEY` | Clé privée SSH de déploiement |
| Secret | `EMPLOIDIRECT_KNOWN_HOSTS` | Empreinte du serveur déjà vérifiée |
| Variable | `EMPLOIDIRECT_PRODUCTION_HOST` | Hôte SSH |
| Variable | `EMPLOIDIRECT_PRODUCTION_PORT` | Port SSH (habituellement 22) |
| Variable | `EMPLOIDIRECT_PRODUCTION_USER` | Utilisateur cPanel |
| Variable | `EMPLOIDIRECT_PRODUCTION_APP_ROOT` | Répertoire de l'application Node (PAS `DATA_DIR`) |
| Variable | `EMPLOIDIRECT_PRODUCTION_URL` | URL HTTPS pour le contrôle santé |

5. Le workflow `deploy.yml` est démarré après le succès de `CI` sur `main` si ces paramètres sont présents ; on peut aussi le lancer manuellement. Un paramètre manquant fait **sauter le déploiement**, sans supposer qu'il a réussi.
6. Après publication, la vérification `curl` doit retourner une réponse JSON `ok: true` sur `/api/health` avec certificat TLS valide. Une erreur stoppe la livraison.

### Garantie de sécurité et limites

- Aucun secret, mot de passe ou jeton n'est commité.
- Un déploiement n'écrase jamais `DATA_DIR` ; le code est envoyé via rsync dans la racine de l'app en excluant `.data/`, `.env`, `node_modules/` et `tmp/`.
- Il faut que `node_modules` de production soit installé sur le serveur une première fois. Selon les exigences de MochaHost, la commande `npm install --omit=dev` peut être exécutée depuis cPanel, ou les dépendances préparées dans l'environnement de CI compatible et envoyées explicitement. Le workflow fourni installe les dépendances de production dans l'artefact et les transfère.
- Une relance Passenger (cPanel) est demandée par la création de `tmp/restart.txt`. Vérifier que la configuration de l'application utilise ce mécanisme.
- En cas d'incident, revenir au commit Git précédent via un nouveau déploiement. Sauvegarder séparément `DATA_DIR` avant toute restauration.
- La base JSON exige une seule instance Node et un volume persistant. Ne pas activer des exécutions simultanées avant migration SQL.
