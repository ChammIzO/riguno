# Prix marchands dynamiques

## Fonctionnement implémenté

Collecte horaire → flux marchand JSON/CSV autorisé → correspondance exacte OpenDB → validation → API serveur `/api/ingest` → D1 → `/api/riguno?action=prices` → fiche composant.

Les cinq identifiants marchands sont `amazon`, `grosbill`, `ldlc`, `topachat`, `materielnet`. Ce sont des adaptateurs de flux configurables, **pas cinq API partenaires déjà connectées**. Le connecteur Amazon nécessite un pont vers Creators API qui retourne le contrat normalisé ci-dessous ; ce pont d’authentification fournisseur n’est pas encore implémenté. La documentation officielle actuelle est https://affiliate-program.amazon.com/creatorsapi/docs/ ; ne pas partir sur une intégration PA-API dépréciée.

## Configuration

1. Obtenir l’accès aux flux/APIs auprès des marchands ou réseaux partenaires.
2. Déployer Riguno avec D1, appliquer la migration, ajouter un secret serveur `PRICE_INGEST_TOKEN` aléatoire de 32 caractères minimum. Ne jamais l’envoyer au navigateur.
3. Ajouter trois secrets GitHub Actions :
   - `RIGUNO_FEEDS` : tableau JSON de sources réelles, basé sur `tools/pricing/feeds.example.json`. Les valeurs REPLACE ne sont pas des endpoints.
   - `RIGUNO_INGEST_URL` : URL HTTPS réelle terminant par `/api/ingest`.
   - `RIGUNO_INGEST_TOKEN` : même secret que le serveur.
4. Chaque flux doit fournir les champs `part_id`, `amount`, `shipping`, `in_stock`, `url`, `observed_at` et éventuellement `country`, `currency`. `part_id`, lorsqu’il est fourni, doit être un UUID exact connu du catalogue ; sinon fournir les identifiants commerciaux décrits ci-dessous.
5. Le collecteur peut aussi résoudre un produit sans `part_id` grâce à un EAN/UPC/GTIN, un ASIN propre au marché Amazon, un identifiant marchand ou un couple marque + référence fabricant. Les correspondances ambiguës ou contradictoires sont rejetées. L’index exact est construit depuis l’archive OpenDB locale. `fields` permet de mapper les noms de colonnes, `format` accepte `json` ou `csv`, `delimiter` règle le CSV, `root` choisit une liste dans une réponse JSON, `token` ajoute un Bearer fournisseur. Aucun rapprochement flou de noms n’est effectué. Un nom commercial seul ne suffit pas.
6. Lancer le workflow manuellement, puis contrôler le compteur d’observations et les fiches.

Ne pas committer de credentials ou de dumps marchands sous une licence ouverte. Une autorisation d’affichage n’implique pas une autorisation d’archivage. `history_allowed` est **false** par défaut pour chaque source, notamment Amazon ; l’activer uniquement si le contrat de la source permet la conservation historique. Les restrictions de cache/images/prix doivent être appliquées dans le pont fournisseur. Sources contractuelles Amazon : https://affiliate-program.amazon.com/help/operating/policies.

## Fraîcheur et comparaison

- Timestamp issu de l’observation fournisseur, jamais remplacé par l’heure d’un import d’un ancien fichier.
- TTL configurable, au plus 24 h ; le délai contractuel plus court doit être appliqué.
- Offres expirées exclues de la réponse ; indisponibles placées après celles en stock.
- Comparaison dans le même pays et la même devise, livraison connue en premier, puis prix total. Pas de conversion monétaire inventée.
- `shipping: null` signifie frais inconnus ; zéro signifie livraison gratuite.
- Échec de fournisseur isolé des autres. Ses dernières offres expirent normalement.
- Historique dédupliqué par produit, marchand, pays, devise, URL et timestamp.
- Aucun historique rétroactif n’est créé. Aucun prix réel n’est fourni dans les fixtures de test.

À compléter : ponts natifs des APIs partenaires, panier global multi-boutiques avec frais mutualisés, quotas et backoff propres à chaque fournisseur. GitHub cron peut être retardé ; la fréquence horaire n’est pas une garantie temps réel.
