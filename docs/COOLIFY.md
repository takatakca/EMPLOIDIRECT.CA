# Déploiement Coolify / Contabo — EMPLOIDIRECT.CA

Le dépôt fournit maintenant un `Dockerfile` multi-stage : installation, tests et build sur le builder, puis exécution Node 22 sans droits root. Ne jamais construire sur un hébergement cPanel limité.

## Déploiement autorisé

1. Dans Coolify, ajouter une application depuis `takatakca/EMPLOIDIRECT.CA`, branche `main`, type **Dockerfile** (chemin `/Dockerfile`), en production seulement si le lancement est autorisé.
2. Brancher le domaine `emploidirect.ca` après validation DNS et HTTPS. Le reverse proxy Coolify doit envoyer les requêtes vers le port interne **3001**.
3. Configurer les variables **non commitées** : `NODE_ENV=production`, `PORT=3001`, `APP_ORIGIN=https://emploidirect.ca`, `DATABASE_URL` et éventuellement `DATABASE_SSL_CA_FILE`. Ne configurer `TRUST_PROXY=true` que si Coolify fait réellement confiance au proxy d'entrée.
4. Préparer la base PostgreSQL autorisée et ses sauvegardes avant le premier démarrage. Sans `DATABASE_URL`, le conteneur refuse intentionnellement de démarrer.
5. Vérifier `https://emploidirect.ca/api/health` (HTTP 200 + `ok:true`), connexion et déconnexion, isolation des offres par employeur, publications approuvées et retraits de candidatures.
6. Activer les alertes de santé, rotation des secrets, règles de sauvegarde/restauration et revue sécurité. Ne pas accepter de données personnelles avant validation de conformité et de TAKATAK Auth.

## Interdictions opérationnelles

- **Ne pas** considérer que ce Dockerfile provisionne PostgreSQL ou active automatiquement Coolify.
- **Ne pas** connecter la version Render gratuite en écriture. L'aperçu doit garder `PREVIEW_READ_ONLY=true`.
- **Ne pas** déployer simultanément deux environnements actifs acceptant des candidatures sans stratégie de base partagée, rétention, notification et bascule.
- **Ne pas** placer une base de données dans l'image Docker ni dans `.data` éphémère.

## CI / validation

`npm run check` valide les tests API et TypeScript. Le workflow CI vérifie aussi l'image Docker avec `docker build`. Déployer uniquement un commit testé. Le healthcheck Docker interroge l'API et son magasin de données ; HTTP 503 indique un stockage indisponible.

Voir aussi `docs/POSTGRESQL.md`, `docs/DEPLOIEMENT.md` et `ROADMAP.md`.
