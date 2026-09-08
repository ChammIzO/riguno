# Installation et hébergement

Le dépôt conserve le code complet, les données et les ressources localement. Aucun Site n’a été publié dans cette livraison.

## Application

`configurator/` utilise React 19, TypeScript, Vinext/Vite et Cloudflare Workers. Le lockfile fixe les versions. Node 22.13+ est requis. `npm ci`, `npm run build`, `npm run dev` depuis ce dossier. Le catalogue est servi localement depuis `public/data`.

## Données serveur

Lier une base D1 avec le nom `DB` (déclaré dans `.openai/hosting.json`) et appliquer `migrations/0001_riguno.sql`. Le runtime Sites gère ces bindings lorsqu’il est utilisé pour le déploiement. Pour un hébergement Cloudflare autonome, créer la base, renseigner l’ID réel dans la configuration de déploiement et appliquer les migrations avec Wrangler. Ne pas déployer l’ID factice présent dans la configuration de build locale.

Les offres sont stockées en base, pas dans GitHub : le code et les données ouvertes restent reproductibles, les données personnelles et secrets restent hors dépôt. Faire des sauvegardes de D1 avec une politique de rétention explicite.

## Authentification

Les routes de connexion ChatGPT (`/signin-with-chatgpt`, `/signout-with-chatgpt`) appartiennent au dispatcher Sites. Le serveur récupère l’identifiant transmis par ce dispatcher et applique les droits sur toutes les configurations. **Un hébergement autonome doit implémenter et valider son propre fournisseur d’identité avant d’activer les comptes.** Il ne doit jamais accepter des en-têtes d’identité fournis librement par le client.

Pour protéger les déploiements autonomes, les opérations de compte sont désactivées par défaut. `RIGUNO_TRUSTED_SITES_AUTH=enabled` ne doit être défini que lorsque l’accès direct au Worker est impossible et que le dispatcher authentifié réécrit les en-têtes. Sans cela, seule la configuration locale fonctionne. Ce réglage n’est pas un mécanisme d’authentification autonome.

## Régénération

```sh
git clone https://github.com/buildcores/buildcores-open-db.git /tmp/buildcores-open-db
git -C /tmp/buildcores-open-db checkout 547b32703b370142f17b09c3047c80dc88ba5260
python tools/import_catalog.py /tmp/buildcores-open-db
python tools/link_assets.py
python tools/generate_models.py
```

L’archive locale `data/upstream/buildcores-open-db.tar.gz` contient tous les enregistrements, schémas et avis de licence. Le catalogue d’interface est une sélection de catégories, pas une sélection arbitraire de quelques modèles.
