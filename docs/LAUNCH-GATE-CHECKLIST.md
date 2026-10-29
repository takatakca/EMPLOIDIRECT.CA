# Grille de lancement — EMPLOIDIRECT.CA (issue #1)

Agent : KLEAN. Date : 2026-10-29 (soir, EDT).
Repo : takatakca/EMPLOIDIRECT.CA. Main vérifié au départ :
`c3cc249e6412dad176cd3d74f5290abbe04e4076` (2026-10-28T17:55:55Z,
« docs: record verified PostgreSQL CI and permanent agent handoff »).
Aucun mot de passe, code ou secret dans ce document.
Docs seulement — ce fichier ne déploie rien, ne merge rien, ne modifie
aucune identité, aucun secret, aucune production.

## Règle fail-closed (non négociable)

- Tant qu'une étape propriétaire n'est pas verte avec preuve, la porte
  reste fermée : prévisualisation Render lecture seule, candidatures
  fermées, aucune candidature réelle collectée.
- Un pipeline CI vert sur PostgreSQL éphémère ne prouve PAS un
  hébergement commercial persistant.
- Un déploiement MochaHost rouge faute de secrets n'est PAS un échec
  de code ; c'est le pipeline fail-closed prévu (PR #3, étape
  « Validate deployment prerequisites »).
- Aucun agent ne peut approuver le lancement à la place du propriétaire.
  Commentaire issue #1 du 2026-10-29 17:09:16Z (13:09 EDT) :
  « Sweep GitHub du 2026-10-29 : cette porte de lancement exige une
  décision humaine GO ainsi que la configuration de production
  (persistance, TAKATAK Auth, conformité) — aucun agent ne peut
  l'approuver à la place du propriétaire. — Robot GitHub A (Taktak),
  2026-10-29 ».

## État vérifié 2026-10-29

Issue #1 OUVERTE : « Launch gate: production readiness, persistence,
TAKATAK Auth and compliance », créée 2026-10-14, mise à jour
2026-10-29T17:09:16Z, 1 commentaire (celui cité ci-dessus).
Vérifiés : PR #4 fusionnée à 5f7a0b6 ; CI verte (application, Docker,
vrai PostgreSQL 16) ; journal et ROADMAP à jour à c3cc249 ; CI et
Render contrôlés sur c3cc249 (3 jobs réussis), preview Render live
(lecture seule).
Non vérifiés / non cochés dans l'issue : secrets et variables de
déploiement, production MochaHost, PostgreSQL persistant avec
sauvegarde/restauration, identité TAKATAK, vérification courriel et
modération, Loi 25, tests de sécurité, disponibilité HTTPS réelle.
Références : `docs/DEPLOIEMENT.md`, `docs/POSTGRESQL.md`, `ROADMAP.md`.

## Les 7 étapes — qui fait quoi, quelle preuve

### Étape 0 — Décision propriétaire : périmètre takatak-v1 #201 [PROPRIÉTAIRE]
- Confirmation écrite du propriétaire : authentification et entitlements
  fournis par TAKATAK V1 ; l'auth locale actuelle d'EMPLOIDIRECT reste
  non-maître et ne doit pas être promue identité maître.
- Preuve attendue : décision écrite du propriétaire, référencée dans
  l'issue #1. Sans elle, aucun changement d'identité.
- Statut 2026-10-29 : EN ATTENTE.

### Étape 1 — Secrets et variables de production [PROPRIÉTAIRE SEULEMENT]
- Configurer, côté propriétaire seulement, les secrets et variables
  listés dans `docs/DEPLOIEMENT.md`. KLEAN ne les demande pas, ne les
  lit pas, ne les inscrit nulle part.
- Preuve attendue : pipeline de déploiement qui ne saute plus faute de
  prérequis (sans jamais exposer une valeur de secret dans un log,
  un document ou un commit).
- Statut 2026-10-29 : EN ATTENTE — absents, aucune production
  MochaHost confirmée.

### Étape 2 — PostgreSQL commercial persistant [PROPRIÉTAIRE + PREUVE]
- Provisionner un PostgreSQL persistant (hors CI éphémère), avec
  sauvegarde, rétention, supervision — et une restauration PROUVÉE
  (test de restauration documenté, pas seulement une sauvegarde
  déclarée).
- La migration relationnelle finale reste un travail futur distinct
  (voir ROADMAP).
- Preuve attendue : rapport de restauration réussie + santé
  `/api/health` en staging/production réelle.
- Statut 2026-10-29 : EN ATTENTE.

### Étape 3 — Comptes et modération [CODE/DOCS, PUIS VALIDATION]
- Vérification courriel, récupération de compte, vérification
  employeur, modération des offres, contrôles anti-abus, livraison
  des notifications utilisateur.
- Preuve attendue : parcours testés en staging, historique d'audit
  pour la vérification employeur et la modération.
- Statut 2026-10-29 : EN ATTENTE.

### Étape 4 — Conformité Loi 25 (Québec) [PROPRIÉTAIRE + DOCS]
- Avis de confidentialité, exigences Loi 25, contact officiel pour
  les demandes de confidentialité, politique de divulgation et de
  rétention (ROADMAP : coordonnées légales / responsable de la
  protection des renseignements personnels à valider).
- Preuve attendue : textes validés par le propriétaire et publiés
  avant toute collecte réelle.
- Statut 2026-10-29 : EN ATTENTE.

### Étape 5 — Validation staging E2E et sécurité [CODE/DOCS]
- E2E en staging, revue d'accessibilité de base, revue de sécurité,
  sur les parcours principaux (publication d'offre, candidature,
  retrait du candidat, accès réservé aux employeurs).
- Preuve attendue : résultats E2E et revue documentés, défauts
  bloquants corrigés.
- Statut 2026-10-29 : EN ATTENTE.

### Étape 6 — Vérification réelle après déploiement [APRÈS 0–5 VERTS]
- HTTPS `GET /api/health` avec certificat TLS valide, confidentialité
  et retrait du candidat, accès employeur seulement à ses propres
  candidatures.
- Preuve attendue : réponses HTTP réelles observées sur
  `emploidirect.ca`, pas sur la preview lecture seule.
- Statut 2026-10-29 : EN ATTENTE — non applicable tant que 0–5
  ne sont pas verts.

### Étape 7 — Lancement commercial [DÉCISION HUMAINE GO, PROPRIÉTAIRE]
- Seulement quand les étapes 0–6 sont vertes avec preuves : mise en
  ligne de `emploidirect.ca` avec candidatures activées, après
  confirmation de la propriété du domaine, du DNS, du SSL, de la
  racine applicative Node 22 et du comportement de redémarrage
  Passenger cPanel.
- Statut 2026-10-29 : BLOQUÉ — en attente du GO humain du propriétaire.

## Ce que cette PR ne fait PAS

- Aucun merge, aucun déploiement, aucun push direct sur main.
- Aucune modification de l'authentification, de l'identité, des
  secrets, de la base de données ou de la production.
- Aucune réouverture d'application sur la preview Render.
- Aucune collecte de candidature réelle.

## Reprise par le prochain agent

1. Relire l'issue #1 et cette grille ; ne pas cocher une étape sans
   preuve citée (lien, rapport, décision écrite).
2. Ne pas déclarer le déploiement terminé sans confirmation de la
   cible et de la réponse HTTP réelle.
3. Consigner chaque changement de statut dans Drive et GitHub, sans
   secret, et laisser cette grille en PR non mergée tant que le
   propriétaire ne l'a pas revue.
