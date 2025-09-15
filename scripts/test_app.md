# Guide de test de l'application Gyara Ni

## Fonctionnalités à tester

### 1. Authentification
- [ ] Connexion avec un compte existant
- [ ] Redirection vers le dashboard après connexion
- [ ] Déconnexion depuis le header

### 2. Dashboard principal
- [ ] Affichage des statistiques (revenus, produits, commandes, alertes)
- [ ] Graphiques des ventes et revenus
- [ ] Navigation vers les autres sections

### 3. Gestion des produits
- [ ] Liste des produits avec recherche et filtres
- [ ] Création d'un nouveau produit
- [ ] Modification d'un produit existant
- [ ] Suppression d'un produit
- [ ] Affichage du statut de stock

### 4. Gestion des catégories
- [ ] Liste des catégories
- [ ] Création d'une nouvelle catégorie
- [ ] Modification d'une catégorie existante
- [ ] Suppression d'une catégorie

### 5. Gestion des commandes
- [ ] Liste des commandes avec filtres par statut
- [ ] Création d'une nouvelle commande
- [ ] Visualisation des détails d'une commande
- [ ] Modification du statut d'une commande
- [ ] Statistiques des commandes

### 6. Gestion de l'inventaire
- [ ] Vue d'ensemble de l'inventaire
- [ ] Alertes de stock faible
- [ ] Ajustement de stock (entrée, sortie, ajustement)
- [ ] Historique des mouvements de stock
- [ ] Ajustement de stock pour un produit spécifique

### 7. Notifications
- [ ] Affichage des notifications dans le header
- [ ] Page des notifications
- [ ] Marquer comme lu / supprimer les notifications

### 8. Navigation et interface
- [ ] Sidebar avec navigation par rôle
- [ ] Responsive design sur mobile
- [ ] Thème sombre/clair (si implémenté)

## Données de test recommandées

### Catégories
- Boissons chaudes
- Boissons froides
- Snacks
- Produits laitiers

### Produits
- Café Expresso (Boissons chaudes) - 500 FCFA
- Thé à la menthe (Boissons chaudes) - 300 FCFA
- Jus d'orange (Boissons froides) - 400 FCFA
- Sandwich (Snacks) - 800 FCFA

### Commandes de test
- Commande avec plusieurs produits
- Commande avec paiement en espèces
- Commande avec paiement par carte
- Commande avec statuts différents

## Problèmes potentiels à vérifier

1. **Erreurs de base de données**
   - Vérifier que les triggers fonctionnent
   - Vérifier les contraintes RLS
   - Vérifier les fonctions RPC

2. **Erreurs d'interface**
   - Composants qui ne se chargent pas
   - Formulaires qui ne se soumettent pas
   - Navigation qui ne fonctionne pas

3. **Erreurs de performance**
   - Chargement lent des pages
   - Requêtes qui prennent du temps
   - Interface qui se bloque

## Commandes utiles

```bash
# Démarrer l'application
npm run dev

# Vérifier les erreurs de linting
npm run lint

# Construire l'application
npm run build
```

## Base de données

Assurez-vous que tous les scripts SQL ont été exécutés dans l'ordre :
1. 001_create_users_and_profiles.sql
2. 002_create_categories_and_products.sql
3. 003_create_inventory_management.sql
4. 004_create_orders_and_sales.sql
5. 005_create_notifications.sql
6. 006_seed_initial_data.sql
7. 007_notification_triggers.sql
8. 008_seed_initial_data_fixed.sql