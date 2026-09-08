# Sécurité

Ne pas ouvrir un ticket public contenant un secret ou les données personnelles d’un utilisateur. Le mainteneur doit renseigner un canal de signalement privé avant ouverture publique.

Mesures présentes : validation Zod, requêtes SQL paramétrées, restrictions propriétaires sur suppression/partage/lecture, configurations privées par défaut, liens publics opaques et révocables, contrôle d’origine pour mutations navigateur, limitation des écritures par utilisateur, limitation des imports, URL HTTPS de marchands autorisés, endpoint de collecte protégé par secret, absence de paiement et de mot de passe stockés par Riguno.

L’authentification dépend du dispatcher Sites et reste désactivée hors environnement explicitement approuvé. Ne pas exposer le Worker directement avec des en-têtes d’identité non vérifiés. Ne jamais activer le mock d’authentification en production.

Avant production : audit du fournisseur d’identité et du proxy, quotas de lecture et anti-abus au niveau hébergeur, sauvegardes D1, HTTPS/HSTS, politique CSP adaptée aux scripts générés, tests navigateur et tests d’intégration authentifiés, revue des dépendances et des CGU, coordonnées de l’éditeur. Le projet n’a pas subi d’audit de sécurité indépendant.
