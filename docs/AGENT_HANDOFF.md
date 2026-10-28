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
3. **P1 Tests PostgreSQL réels** : compléter les tests de transaction/isolation contre un véritable PostgreSQL éphémère en CI (pas seulement le mock).
4. **P1 Identity** : contrat dédié avec TAKATAK V1, auth/sessions et entitlements autorisés par serveur. Voir https://github.com/takatakca/takatak-v1/issues/201 ; ne pas affirmer que l'auth fédérée est branchée.
5. **P1 Production** : configuration HTTPS, secrets, DNS et hébergement persistants, sauvegardes/rétablissement, messages transactionnels et E2E.
6. **P2** : modération anti-fraude, accessibilité, observabilité, performances et séparation des données TAKATAK/client.

## Journal signé (ajouter sans supprimer l'historique)

- **2026-10-28 13:47 EDT — GPT-6 · session EMPLOIDIRECT — DÉBUT** : vérification directe GitHub : `main 4c64918`, CI réussie, workflow MochaHost échoué, #2/#3 déjà fusionnées, seulement les trois branches nommées plus haut. `AGENTS.md` et `docs/AGENT_HANDOFF.md` absents. Consultation du protocole Drive et recherche de note EMPLOIDIRECT non concluante. Choix : instaurer notes et poursuivre la validation de persistance sans activer les écritures en prévisualisation.
- **2026-10-28 13:47 EDT — GPT-6 · session EMPLOIDIRECT — CHECKPOINT 1** : `AGENTS.md` créé sur `main`, commit `038b02e5560aba4f9d9e0c729267c4e0862496bc`. Ce document est le second checkpoint GitHub ; documenter chaque prochain SHA ci-dessous.

## Interdictions de conclusion trompeuse

Ne jamais annoncer 100 %, lancement commercial, authentification TAKATAK opérationnelle, sauvegarde PostgreSQL réelle ou déploiement à `emploidirect.ca` sans preuves de bout en bout. Les blocages de secrets et de gestion DNS se résolvent dans la console autorisée, pas en inventant des valeurs.
