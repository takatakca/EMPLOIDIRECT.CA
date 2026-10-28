# AGENTS.md — EMPLOIDIRECT.CA

> Règles permanentes du repository. Dernière synchronisation : 2026-10-28 13:47 EDT. Responsable de cette entrée : GPT-6 · reprise TAKATAK.

## Sources de vérité et ordre obligatoire

1. Vérifier le SHA actuel de `main`, les branches, PR, issues et GitHub Actions **avant toute modification**.
2. Lire `AGENTS.md`, `docs/AGENT_HANDOFF.md`, `README.md`, `ROADMAP.md`, `docs/POSTGRESQL.md`, `docs/COOLIFY.md` et les workflows.
3. Lire les notes Drive pertinentes, sans substituer une note ancienne à l'état du dépôt.
4. Inscrire un checkpoint **dès le début**, puis à chaque étape importante et avant la fin, avec signature et SHA des commits.
5. Continuer à partir de la branche réellement à jour. Ne pas réinventer l'application, ne pas effacer du travail d'agent ni fusionner une branche sans vérifier sa différence avec `main`.

## Règles TAKATAK

- ADD-ONLY pour les notes et droits ; pas de destruction ou dégradation des accès sans instruction explicite.
- Aucune donnée privée, coordonnées confidentielles, CV, candidatures, secrets, mots de passe ou tokens dans GitHub.
- Ne jamais inventer d'offres, utilisateurs, entreprises, métriques de ventes ou état de déploiement.
- Toujours distinguer **CI verte**, **Render preview live** et **production vérifiée**.
- EMPLOIDIRECT demeure indépendant comme plateforme livrable ; les données de recrutement restent dans son périmètre autorisé. L'identité TAKATAK maître doit être intégrée par un contrat vérifié et des permissions par tenant, jamais en faisant confiance aux champs client.
- Mode aperçu Render **lecture seule**. Ne pas activer des écritures publiques sans PostgreSQL persistant, sauvegardes/restauration, validation des accès, consentements et conformité Québec Loi 25.
- Exécuter les tests et le build **avant** une fusion ; contrôler les résultats Actions et le déploiement après publication. Un build réussi ne prouve pas le fonctionnement commercial.
- Éviter les dépenses, changements DNS ou déploiements destructeurs non validés.

## Flux de travail

1. Reprendre le checkpoint daté le plus récent dans `docs/AGENT_HANDOFF.md`.
2. Préparer des changements petits, testables, réversibles ; branche dédiée pour tout code métier.
3. Inscrire les modifications dans le handoff pendant le travail, avec états `À faire / En cours / Vérifié / Bloqué`.
4. Corriger tous les échecs CI relevant du code. Si l'échec dépend de secrets/infrastructure indisponibles, documenter la dépendance et ne pas falsifier un succès.
5. Décrire exactement quels commits ont été **poussés** et lesquels ont été **fusionnés**.
6. Mettre à jour le suivi GitHub et la note Drive du bon projet à la fin, sans copier de données personnelles.

## Entrée initiale de reprise

2026-10-28 13:47 EDT — GPT-6 · session EMPLOIDIRECT — `main` vérifié à `4c649186a23f6dd013b795bbf74e5251076a4a90`; dernière CI verte, workflow MochaHost échoué faute de configuration ; PR #2/#3 déjà fusionnées. Pas de `AGENTS.md` ni de `docs/AGENT_HANDOFF.md` avant ce checkpoint. Voir le handoff pour le détail et la suite.
