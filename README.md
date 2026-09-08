# Riguno

Configurateur PC gratuit et open source. Application dédiée dans [`configurator/`](configurator/).

**État : version de développement fonctionnelle, non déployée.** Ce dépôt ne prétend pas fournir une validation mécanique complète ni des prix temps réel sans sources marchandes configurées.

- 47 869 fiches OpenDB archivées localement, dont **29 586** références dans les neuf catégories configurables.
- Interface React/TypeScript responsive, thèmes clair/sombre/automatique, recherche par modèle et marque, sélection et retrait des composants.
- Contrôles de sockets, génération et capacité RAM, longueur GPU, slots, ventirad, formats et puissance. Données absentes affichées comme inconnues.
- Scène interactive de volumes 3D, rotation, zoom, éclatement et animation illustrative du flux d’air. Neuf enveloppes `.gltf` réutilisables ; ce ne sont pas les modèles propriétaires BuildCores.
- Deux photographies sous licences Creative Commons, attribuées et liées à leurs références exactes ; les autres références ont une icône explicite.
- Sauvegarde locale, export JSON, API de configurations privées/publiques et préférences. Connexion via le service ChatGPT de la plateforme Sites, pas encore de compte autonome email/mot de passe.
- Collecteur dynamique de flux marchands JSON/CSV, API d’ingestion avec secret, offres expirables et historique conditionné aux droits de conservation.
- Amazon FR/DE/UK/US : liens produit issus des ASIN par marché. Grosbill, LDLC, TopAchat, Materiel.net : import d’offres issues de flux autorisés à configurer.

## Organisation

| Chemin | Contenu |
|---|---|
| `configurator/app/` | Pages et API serveur |
| `configurator/components/riguno/` | Interface et visualisation technique |
| `configurator/lib/` | Modèle métier, compatibilité et validation |
| `configurator/public/data/` | Catalogues JSON utilisables hors ligne |
| `configurator/public/images/` | Photos originales et crédits |
| `configurator/public/models/` | Neuf enveloppes glTF génériques MIT |
| `configurator/migrations/` | Schéma SQL des profils, configurations, offres, historique, benchmarks |
| `data/upstream/` | Archive OpenDB complète, licence et commit source |
| `data/assets/` | Provenance des images et licences |
| `tools/` | Import, modèles et collecte des prix |
| `tests/` | Tests métier, prix et SQL |
| `docs/` | Installation, limites, sécurité, sources et prix |

## Démarrage

Node.js 22.13+ et Python 3.12+. Depuis un clone :

```sh
cd configurator
npm ci
npm run build
npm run dev
```

La base statique fonctionne sans clé. Pour les sauvegardes serveur et les prix, configurer D1 et appliquer `migrations/0001_riguno.sql`. Voir [installation](docs/INSTALLATION.md).

```sh
node --experimental-strip-types --test tests/compatibility.test.mjs
python -m unittest discover -s tests -p 'test_*.py'
```

## Prix dynamiques

Le workflow `.github/workflows/prices.yml` exécute le collecteur toutes les heures et manuellement. Sans configuration, il indique qu’aucun flux n’est connecté. Il n’invente ni n’extrait de prix depuis OpenDB. Les contrats marchands, leurs accès et le déploiement de l’API sont indispensables. Voir [PRICING.md](docs/PRICING.md).

## Limites restantes

Pas encore de bibliothèque exhaustive de photos/CAO exactes, de CFD thermique, de collisions de maillages détaillés, de choix multiples dans une même catégorie, de traduction complète anglaise, de prix marchands live sans accès partenaire, ni de bibliothèque de benchmarks mesurés. Les préférences régionales concernent les offres et le format des nombres. Les textes juridiques restent à compléter avec l’identité réelle de l’éditeur avant ouverture publique.

## Licences

Code et enveloppes originales : MIT. Base : BuildCores OpenDB, ODC-By 1.0, avis intacts dans `data/upstream/`. Photos : licences propres dans `data/assets/manifest.json`. Les droits sur les contenus tiers ne deviennent pas MIT.
