# PostgreSQL — stockage durable EMPLOIDIRECT.CA

## Garantie actuelle

L'API v1 conserve son contrat `read()` / `update()` et utilise une ligne JSONB transactionnelle dans `emploidirect_state`. Un verrou de ligne `SELECT ... FOR UPDATE` garantit qu'une seule mutation s'exécute à la fois, y compris avec plusieurs instances Node. Les transactions échouées sont annulées. La rétention des candidatures reste de 180 jours lors des écritures et de la maintenance quotidienne.

Cette étape apporte la persistance et l'atomicité PostgreSQL **sans prétendre** offrir une base relationnelle finale ni une sauvegarde opérationnelle déjà activée. La base doit être provisionnée par l'exploitant : ne créez aucun service payant automatiquement.

## Configuration

1. Provisionner une base PostgreSQL persistante autorisée, privée et sauvegardée ; créer un compte applicatif à privilèges limités.
2. Dans l'environnement serveur : `NODE_ENV=production`, `DATABASE_URL=postgresql://...`, `APP_ORIGIN=https://emploidirect.ca`. Exiger TLS vérifié (chaîne CA en `DATABASE_SSL_CA_FILE` si nécessaire ; ne jamais utiliser `rejectUnauthorized=false`).
3. Ne pas activer `PREVIEW_READ_ONLY=false` sur Render Free : le système de fichiers est éphémère. Prévisualisation publique = lecture seule.
4. La première connexion crée la table `emploidirect_state` si absente et la ligne singleton vide. La table doit être sauvegardée avec une politique de rétention, récupération et contrôle d'accès.
5. Exécuter des sauvegardes PostgreSQL chiffrées, contrôles d'intégrité et **un test de restauration**. Les sauvegardes doivent respecter les obligations de protection et de suppression des renseignements personnels.

## Import depuis v1 JSON (si données existantes)

1. Arrêter les écritures de l'ancienne application et copier l'ancien fichier `db.json` dans un endroit sécurisé.
2. Vérifier le fichier source, sauvegarder également PostgreSQL et confirmer que la base cible ne contient **aucune donnée**.
3. Lancer manuellement :

```bash
DATABASE_URL='postgresql://...' node scripts/import-json-to-postgres.js /private/backup/db.json --confirm
```

4. Vérifier les comptes, les offres et les candidatures, les autorisations de chaque employeur et les retraits, puis basculer le trafic.
5. Conserver la sauvegarde chiffrée selon la politique officielle de rétention. Ne pas commiter des secrets ou des données réelles dans GitHub.

**Important :** l'import refuse d'écraser une base déjà remplie. Les transactions assurent une importation tout-ou-rien.

## Critères de lancement encore non remplis

- Contrôle légal (Loi 25), responsable des renseignements personnels et avis de confidentialité approuvés
- Intégration réelle TAKATAK Auth/entitlements et isolation multi-tenant validée
- Vérification de courriel, récupération de comptes, modération, alertes et notifications
- Tests de restauration, supervision, anti-abus et revue sécurité/a11y E2E
- Mise en production SSL/DNS et contrôle HTTPS réel sur `emploidirect.ca`

Le statut `ok:true` du healthcheck signifie que le magasin est accessible ; il ne remplace ni un audit de sécurité ni une vérification fonctionnelle de bout en bout.

## Tests PostgreSQL réels en CI (28 octobre 2026)

Le job `postgres-integration` exécute `tests/postgres-integration.test.js` contre un conteneur PostgreSQL 16 éphémère. Il vérifie les transactions concurrentes de **deux pools**, le verrouillage de ligne, le rollback et la purge de rétention. Le test refuse de s'exécuter sur tout nom de base autre que `emploidirect_ci` ou un hôte non local. Le mot de passe du job est exclusivement fictif, sans accès à la production.

Ces tests ne prouvent pas les sauvegardes, restaurations ou la performance à grande échelle : les opérations de production restent interdites tant que ces points ne sont pas validés.
