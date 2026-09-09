# Tester Riguno sur GitHub Pages

La version statique reprend la même interface que le serveur. Elle est construite par `configurator/vite.pages.config.ts` et publiée par `.github/workflows/pages.yml`.

## Activation initiale dans GitHub

1. Ouvrir https://github.com/ChammIzO/riguno/settings/pages.
2. Dans **Build and deployment → Source**, sélectionner **GitHub Actions**.
3. Dans **Actions → Publish GitHub Pages**, cliquer **Run workflow**. Si un premier lancement a échoué avant l’activation, relancer uniquement le job de déploiement.
4. Attendre la réussite de la publication, puis ouvrir https://chammizo.github.io/riguno/.

Le connecteur utilisé pour préparer ce projet ne permet pas de modifier le réglage administratif Pages. Les permissions `pages:write` du workflow servent aux déploiements ; elles ne suffisent pas à activer initialement le service.

## Fonctionnalités disponibles

Catalogue local, recherche, filtres, sélection, compatibilité, caractéristiques techniques, scène 3D indicative, thèmes, préférences régionales, sauvegarde automatique, plusieurs configurations nommées, export et partage par lien.

Les sauvegardes résident dans le navigateur de cet appareil et peuvent être perdues si ses données sont effacées. Exporter les configurations pour les conserver ailleurs. Le lien de partage encode le nom et les identifiants des composants dans le fragment de l’URL ; aucun serveur de compte n’est utilisé. Quiconque possède le lien peut ouvrir la configuration. Ce lien ne peut pas être révoqué.

Cette version ne lance aucun appel aux API serveur absentes sur GitHub Pages. Les comptes et prix automatiques nécessiteront un service complémentaire. Les liens Amazon par marché restent utilisables.

## Vérification locale du build

```sh
cd configurator
npm ci
npm run build:pages
```

Le dossier `dist-pages/` est un artefact généré et reste ignoré par Git. Les chemins de catalogue, d’images, du logo et des liens de partage incluent `/riguno/`. Pour un domaine personnalisé à la racine, construire avec `RIGUNO_PAGES_BASE=/`.

## Parcours de test

- Charger l’exemple, remplacer le CPU ou la RAM et consulter Compatibilité.
- Tourner et zoomer la scène, activer Flux d’air et Vue éclatée.
- Nommer la configuration et l’enregistrer ; la rouvrir dans Mes configurations.
- Changer le thème, recharger et vérifier sa conservation.
- Copier un lien de partage et l’ouvrir dans un autre navigateur.
- Ouvrir une fiche puis un lien marchand du pays sélectionné.

Les modèles 3D et le flux d’air sont indicatifs, les benchmarks mesurés ne sont pas encore alimentés. Signaler les problèmes observés dans les issues du dépôt.
