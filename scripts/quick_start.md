# Démarrage rapide - Gyara Ni

## 1. Installation des dépendances

```bash
npm install
```

## 2. Configuration de l'environnement

Créez un fichier `.env.local` avec vos variables Supabase :

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Configuration de la base de données

Exécutez les scripts SQL dans l'ordre suivant dans votre console Supabase :

1. `001_create_users_and_profiles.sql`
2. `002_create_categories_and_products.sql`
3. `003_create_inventory_management.sql`
4. `004_create_orders_and_sales.sql`
5. `005_create_notifications.sql`
6. `006_seed_initial_data.sql`
7. `007_notification_triggers.sql`
8. `008_seed_initial_data_fixed.sql`

## 4. Démarrage de l'application

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## 5. Création du premier utilisateur

1. Allez sur `http://localhost:3000/auth/signup`
2. Créez un compte avec le rôle "admin"
3. Connectez-vous et accédez au dashboard

## 6. Configuration initiale

1. **Créer des catégories** : Allez dans "Catégories" et créez vos catégories de produits
2. **Ajouter des produits** : Allez dans "Produits" et ajoutez vos produits avec leurs stocks
3. **Ajuster les stocks** : Allez dans "Stock" pour ajuster les quantités initiales
4. **Créer des commandes** : Allez dans "Commandes" pour créer vos premières commandes

## Fonctionnalités principales

- ✅ **Dashboard** : Vue d'ensemble avec statistiques et graphiques
- ✅ **Produits** : Gestion complète du catalogue
- ✅ **Catégories** : Organisation des produits
- ✅ **Commandes** : Gestion des ventes et suivi des statuts
- ✅ **Inventaire** : Suivi des stocks et alertes
- ✅ **Notifications** : Système d'alertes en temps réel
- ✅ **Authentification** : Connexion sécurisée avec rôles

## Support

Si vous rencontrez des problèmes :

1. Vérifiez que toutes les dépendances sont installées
2. Vérifiez que les scripts SQL ont été exécutés
3. Vérifiez que les variables d'environnement sont correctes
4. Consultez les logs de la console pour les erreurs

## Structure de l'application

```
app/
├── auth/                 # Pages d'authentification
├── dashboard/           # Pages du tableau de bord
│   ├── categories/      # Gestion des catégories
│   ├── inventory/       # Gestion des stocks
│   ├── orders/          # Gestion des commandes
│   ├── products/        # Gestion des produits
│   └── notifications/   # Notifications
components/
├── dashboard/           # Composants du dashboard
├── inventory/           # Composants d'inventaire
├── orders/              # Composants de commandes
├── products/            # Composants de produits
└── ui/                  # Composants UI de base
```