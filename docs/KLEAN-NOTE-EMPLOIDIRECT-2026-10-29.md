# 2026-10-29 — KLEAN — emploidirect — note de travail

Projet 7/10 — EMPLOIDIRECT.CA (client emploidirect.ca, repo takatakca/EMPLOIDIRECT.CA).
Agent : KLEAN. Date : 2026-10-29, après-midi (EDT).
Aucun mot de passe, code ou secret dans cette note.

## Entrepris

1. Vérification en lecture seule dans GitHub du repo takatakca/EMPLOIDIRECT.CA :
   état de main, contenu exact de l'issue #1, ce qui bloque le lancement,
   et si un déploiement MochaHost récent a changé quelque chose.
2. Analyse et proposition de déblocage par étapes, sans toucher à l'identité
   maître ni à aucun secret.
3. Dépôt de cette note dans Google Drive (ce fichier) et, prévu, la même note
   dans GitHub via branche + PR (jamais de push direct sur main, jamais de merge).

## Vérifié (GitHub, lecture seule, 2026-10-29)

- **Main actuel : `c3cc249e6412dad176cd3d74f5290abbe04e4076`**
  — « docs: record verified PostgreSQL CI and permanent agent handoff »,
  2026-10-28T17:55:55Z. Inchangé par rapport au point de départ (c3cc249).
  Commit parent : `5f7a0b63ca61ecc4f4f7263e409266ff3bb03bc7` (PR #4 fusionnée).
- **Issue #1 OUVERTE** : « Launch gate: production readiness, persistence,
  TAKATAK Auth and compliance », créée 2026-10-14, mise à jour
  2026-10-29T17:09:16Z, 1 commentaire (contenu du commentaire non lu :
  limite de débit GitHub atteinte pendant la vérification, voir Blocages).
- **Contenu vérifié de l'issue #1 (actualisation du 28 octobre 2026) :**
  - Faits cochés : PR #4 fusionnée à 5f7a0b6 ; CI PR verte (application,
    Docker, vrai PostgreSQL 16) ; journal et ROADMAP mis à jour à c3cc249 ;
    CI et Render contrôlés sur c3cc249 (3 jobs réussis), Render preview
    statut `live`.
  - Faits non cochés : secrets/variables de déploiement absents, aucune
    production MochaHost confirmée ; PostgreSQL persistant avec
    sauvegarde/restauration, identité TAKATAK, vérification email/modération,
    Loi 25, tests de sécurité et vraie disponibilité HTTPS à finaliser.
  - Consigne de l'issue : **ne pas réouvrir les candidatures** sur la
    prévisualisation Render lecture seule. La réussite de tests CI sur une
    base PostgreSQL éphémère ne signifie pas que l'hébergement commercial
    est persistant.
- **Le point dur identité :** l'issue renvoie au contrat suivi dans
  takatak-v1 #201 — authentification et entitlements fournis par TAKATAK V1 ;
  l'auth locale actuelle n'est pas l'identité maître autorisée. L'intégration
  demandée : identité TAKATAK / autorité maître des données, avec accès
  par tenant (tenant-scoped) et entitlements, données employeurs isolées.
- **MochaHost : aucun changement vérifié.** Selon l'issue, le pipeline
  MochaHost est désormais fail-closed si les secrets sont absents (étape
  « Validate deployment prerequisites », PR #3) ; un déploiement rouge n'est
  pas un échec de code ; **aucun téléversement de fichier de production
  n'a été confirmé**. Aucun commit après c3cc249 n'a été observé.
- **Site public :** emploidirect.ca en maintenance (vérifié côté texte,
  copie ancienne, 2026-10-29). Cohérent avec « aucune production confirmée ».

## Poussé

- Cette note dans Google Drive, dossier « 00 — Opérations TAKATAK ».
- **GitHub : NON POUSSÉ pour l'instant.** La création de la branche + PR
  (docs seulement) a été bloquée par une limite de débit GitHub
  (HTTP 429) survenue pendant les lectures, vers 16:11 EDT. Aucun code
  n'a été poussé, rien n'a été mergé, rien n'a été déployé.
  Contenu exact prévu pour la PR : le présent fichier, sous
  `docs/KLEAN-NOTE-EMPLOIDIRECT-2026-10-29.md`, branche
  `klean/note-emploidirect-2026-10-29`, PR vers main, titre
  « docs: note de travail KLEAN emploidirect 2026-10-29 (issue #1) ».
  À reprendre dès que la limite de débit GitHub est levée — ne pas
  contourner la limite en multipliant les appels.

## Proposition exacte (par étapes, sans toucher à l'identité maître ni aux secrets)

1. **Décision propriétaire (étape 0, préalable à tout code) :** confirmer le
   périmètre du contrat takatak-v1 #201 — TAKATAK V1 fournit auth +
   entitlements ; l'auth locale d'EMPLOIDIRECT reste non-maître et ne doit
   pas être promue identité maître. Aucun changement d'identité sans
   cette confirmation écrite du propriétaire.
2. **Secrets/variables, côté propriétaire seulement :** configurer les
   secrets SSH GitHub de production et les variables d'environnement
   documentés dans `docs/DEPLOIEMENT.md`. KLEAN ne les demande pas, ne les
   lit pas, ne les inscrit nulle part.
3. **Persistance :** provisionner un PostgreSQL commercial persistant, avec
   sauvegarde, rétention, supervision et une restauration prouvée ; la
   migration relationnelle finale reste un travail futur distinct.
4. **Comptes et modération :** vérification email, récupération de compte,
   vérification employeur, modération, contrôles anti-abus, livraison des
   notifications utilisateur.
5. **Conformité Loi 25 (Québec) :** avis de confidentialité, exigences
   Loi 25, contact officiel pour les demandes de confidentialité, politique
   de divulgation/rétention.
6. **Validation avant ouverture :** E2E en staging, revue accessibilité de
   base et revue de sécurité, puis vérification réelle après déploiement :
   HTTPS `GET /api/health`, confidentialité/retrait du candidat, accès
   réservé aux employeurs.
7. **Lancement commercial seulement quand 1–6 sont verts :** mise en ligne
   de `emploidirect.ca` avec candidatures activées, après confirmation de
   la propriété du domaine, du DNS, du SSL, de la racine applicative
   Node 22 et du comportement de redémarrage Passenger cPanel.
   D'ici là : prévisualisation Render lecture seule, candidatures fermées.

## Blocages

- **Issue #1 toujours ouverte** : les 8 points durs ci-dessus restent non
  cochés (identité TAKATAK, PostgreSQL persistant, secrets, email/modération,
  Loi 25, E2E/sécurité, vérification HTTPS post-déploiement, lancement).
- **Aucune production MochaHost confirmée** ; le pipeline est fail-closed
  sans secrets — c'est un blocage propriétaire (secrets), pas un défaut de code.
- **Limite de débit GitHub (HTTP 429)** : lectures complémentaires
  (`docs/DEPLOIEMENT.md`, `ROADMAP.md`, liste des PR, commentaire de
  l'issue #1) et création branche + PR non réalisées dans cette passe.
  À reprendre après levée de la limite, sans forcer.
- **Décisions en attente du propriétaire :** périmètre takatak-v1 #201,
  provisionnement PostgreSQL commercial, configuration des secrets,
  feu vert de lancement. KLEAN ne déploie rien, ne merge rien.
