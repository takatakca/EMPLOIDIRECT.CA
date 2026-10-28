# EMPLOIDIRECT.CA — Agent handoff / journal de continuité

Dernier contrôle : **2026-10-28 13:47 EDT**  
Agent : **GPT-6 · session EMPLOIDIRECT**  
Dépôt : https://github.com/takatakca/EMPLOIDIRECT.CA

## État à la reprise (vérifié, pas supposé)

- SHA de `main` initial : `4c649186a23f6dd013b795bbf74e5251076a4a90`.
- Branches existantes : `main`, `build/coolify-production-gates`, `feat/postgres-production-readiness`. Ces deux anciennes branches ont des PR déjà fusionnées ; ne pas re-déployer ou cherry-pick sans comparer les SHAs.
- Pull requests : #2 et #3 fusionnées ; aucune PR active détectée.
- Dernière CI du SHA initial : **success**, exécution https://github.com/takatakca/EMPLOIDIRECT.CA/actions/runs/38952753420.
- Workflow MochaHost du même SHA : **failure**, https://github.com/takatakca/EMPLOIDIRECT.CA/actions/runs/38952826556. Le workflow échoue intentionnellement lorsque les secrets/variables de production manquent ; aucun déploiement MochaHost n'est confirmé.
- Render : aperçu en lecture seule documenté à https://emploidirect-preview.onrender.com ; précédente vérification de livraison « live » au 16 octobre, nouveau contrôle opérationnel à effectuer.
- Source : React + Vite, API Express, magasin JSON de développement, adaptateur PostgreSQL transactionnel JSONB, scripts import, Dockerfile, GitHub CI, tests API. **Ce n'est pas une plateforme commerciale approuvée**.
- Consignes : `AGENTS.md` créé le 28 octobre ; ce fichier inexistant auparavant.
- Drive : recherche ciblée EMPLOIDIRECT / titre exacte sans note attribuable au dépôt ; protocole général TAKATAK consulté. Toute nouvelle note doit rester dans la zone projet appropriée.

## Priorités sans hypothèses

1. **P0 Vérifications** : revérifier Render et la configuration preview, échec réel MochaHost, chaîne de test et image Docker.
2. **P0 Sécurité** : aucun accueil de candidature réelle tant que la persistance, la conformité, les sauvegardes, la vérification des comptes et la gestion des permissions ne sont pas approuvées.
3. **P1 Tests PostgreSQL réels — vérifié en CI PR #4** : concurrence multi-pool, rollback et rétention couverts par PostgreSQL 16 éphémère. **RESTE** : vraie base persistante, sauvegardes et restauration testée.
4. **P1 Identity** : contrat dédié avec TAKATAK V1, auth/sessions et entitlements autorisés par serveur. Voir https://github.com/takatakca/takatak-v1/issues/201 ; ne pas affirmer que l'auth fédérée est branchée.
5. **P1 Production** : configuration HTTPS, secrets, DNS et hébergement persistants, sauvegardes/rétablissement, messages transactionnels et E2E.
6. **P2** : modération anti-fraude, accessibilité, observabilité, performances et séparation des données TAKATAK/client.

## Journal signé (ajouter sans supprimer l'historique)

- **2026-10-28 13:47 EDT — GPT-6 · session EMPLOIDIRECT — DÉBUT** : vérification directe GitHub : `main 4c64918`, CI réussie, workflow MochaHost échoué, #2/#3 déjà fusionnées, seulement les trois branches nommées plus haut. `AGENTS.md` et `docs/AGENT_HANDOFF.md` absents. Consultation du protocole Drive et recherche de note EMPLOIDIRECT non concluante. Choix : instaurer notes et poursuivre la validation de persistance sans activer les écritures en prévisualisation.
- **2026-10-28 13:47 EDT — GPT-6 · session EMPLOIDIRECT — CHECKPOINT 1** : `AGENTS.md` créé sur `main`, commit `038b02e5560aba4f9d9e0c729267c4e0862496bc`. Ce document est le second checkpoint GitHub ; documenter chaque prochain SHA ci-dessous.

- **2026-10-28 13:52 EDT — GPT-6 · session EMPLOIDIRECT — CHECKPOINT 2** : `docs/AGENT_HANDOFF.md` créé sur `main`, commit `e124435d539edb84e840e4f7838edc778a5cfb50`, CI verte. Note Drive créée dans `00 — Opérations TAKATAK/EMPLOIDIRECT.CA — Développement et relève` (lien privé conservé uniquement dans le Drive). Render déclare ce commit `live` en preview ; ceci ne valide pas la production.
- **2026-10-28 13:53 EDT — GPT-6 · session EMPLOIDIRECT — EN COURS** : création branche `test/postgres-integration-20261028` depuis `e124435`. Développement d'un test PostgreSQL réel en CI : concurrence multi-pool, rollback, rétention ; aucune base payante ni donnée réelle.

- **2026-10-28 EDT — GPT-6 · session EMPLOIDIRECT — CHECKPOINT 3** : PR #4 fusionnée après trois jobs verts (`validate`, `docker`, `postgres-integration`) : branche commit `299725c69e6549d46b271f3fdcfd7e90406d6672`, merge `main` SHA `5f7a0b63ca61ecc4f4f7263e409266ff3bb03bc7`. PostgreSQL 16 éphémère en CI prouve la sérialisation, le rollback et la rétention. L'origine HTTPS canonique en production est obligatoire, sauf preview lecture seule.
- **2026-10-28 EDT — GPT-6 · session EMPLOIDIRECT — BLOCAGE** : échec `Deploy EMPLOIDIRECT to MochaHost` : étape `Validate deployment prerequisites`, `EMPLOIDIRECT_*` variables/secrets non configurés ; pas d'upload. Le domaine commercial et la base de production restent non vérifiés. Le preview Render reste distinct de la production.

## Interdictions de conclusion trompeuse

Ne jamais annoncer 100 %, lancement commercial, authentification TAKATAK opérationnelle, sauvegarde PostgreSQL réelle ou déploiement à `emploidirect.ca` sans preuves de bout en bout. Les blocages de secrets et de gestion DNS se résolvent dans la console autorisée, pas en inventant des valeurs.
