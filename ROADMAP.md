# Suivi de développement — EMPLOIDIRECT.CA

## Livré dans le premier socle

- [x] Projet existant inspecté (README seul au départ)
- [x] Interface française responsive, recherche et filtres combinables
- [x] Recherche des offres publiées uniquement, pagination
- [x] Favoris conservés côté navigateur
- [x] Inscription et connexion des employeurs (mot de passe haché)
- [x] Vérification administrative préalable à la publication
- [x] Création, modification, publication et retrait des offres
- [x] Candidature associée à une offre publiée
- [x] Accès employeur limité à ses candidatures
- [x] Lien privé de retrait de candidature
- [x] Tests d'API et build automatisés dans GitHub Actions
- [x] Workflow de livraison MochaHost conditionnel

## À traiter avant un lancement commercial complet

- [ ] Contrôler et valider les coordonnées légales / politique de confidentialité / responsable de la protection des renseignements personnels (Québec, Loi 25)
- [ ] Configuration des secrets d'hébergement, application Node et DNS/TLS pour `emploidirect.ca`
- [x] Ajouter le stockage PostgreSQL transactionnel (adaptateur compatible v1), import JSON protégé et contrôle de santé de la base
- [ ] Configurer une base PostgreSQL persistante réelle, sauvegardes automatisées, restaurations testées et validation de purge
- [ ] Migrer le stockage JSONB transactionnel vers un schéma relationnel pour l'échelle commerciale
- [ ] Envoyer les notifications réelles aux employeurs et confirmations aux candidats (fournisseur courriel vérifié, consentements)
- [ ] Réinitialisation de mot de passe sécurisée, vérification de courriel et protection anti-bot plus forte
- [ ] Tableau d'administration pour vérification des employeurs et modération des offres, historique d'audit
- [ ] Intégration TAKATAK Auth, gestion des entitlements et isolation multi-tenant centralisée
- [ ] Mesures anti-fraude / modération des annonces, signalement, conformité, politique anti-discrimination
- [ ] Gestion avancée des CV/téléversements sécurisés, contrôle des documents sensibles
- [ ] Observabilité, tests E2E et vérification opérationnelle en environnement de préproduction
- [ ] Revue sécurité et tests d'accessibilité WCAG sur les parcours principaux

## Reprise par le prochain agent

1. Lire ce document et `docs/DEPLOIEMENT.md`, puis consulter le dernier commit, les workflows et leurs résultats.
2. Ne pas inventer d'offres ni d'entreprises actives. Ne pas déclarer le déploiement terminé sans confirmation de la cible et de la réponse HTTP.
3. Corriger d'abord tout échec CI. Préserver l'isolation employeur et les données utilisateurs.
4. Priorité : stockage SQL persistant, rétention automatique, vérification des comptes et conformité avant accueil du public.
5. Consigner les modifications réalisées et les blocages restants ici à chaque reprise.

## Reprise du 16 octobre 2026

- Ajout de `server/postgres-store.js` (transactions SQL / verrou de ligne / rétention 180 jours), script d'import sous confirmation et test de transaction avec pool simulé.
- En production hors aperçu, `DATABASE_URL` devient obligatoire; `/api/health` vérifie le magasin de données.
- **Ne pas activer les candidatures** tant que PostgreSQL réel, authentification TAKATAK et conformité ne sont pas vérifiés. Le mode aperçu existant demeure lecture seule.

- [x] Dockerfile multi-stage Node 22 pour Coolify/Contabo, avec build CI, non-root et healthcheck
- [x] Le workflow MochaHost échoue explicitement quand les secrets/variables sont absents : un pipeline vert ne signifie plus un déploiement fictif
- [ ] Provisionner PostgreSQL et associer le domaine final sur Coolify, puis vérifier le service réel
