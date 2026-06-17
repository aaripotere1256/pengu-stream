# 🐧 PenguStream — Forgot Password System

## 📋 Système de Réinitialisation de Mot de Passe Sécurisé

Ce projet implémente un système complet de réinitialisation de mot de passe avec intégration **Brevo** pour l'envoi d'emails.

---

## 🎯 Fonctionnalités

✅ **Formulaire "Mot de passe oublié"** - Saisie sécurisée de l'email  
✅ **Génération de tokens sécurisés** - Cryptage SHA-256 (32 bytes)  
✅ **Lien de réinitialisation par email** - Envoyé via Brevo SMTP  
✅ **Validation de tokens** - Expiration après 15 minutes  
✅ **Page de réinitialisation sécurisée** - Vérification en temps réel  
✅ **Critères de sécurité forts**:
   - Minimum 8 caractères
   - Une lettre majuscule
   - Un chiffre
   - Un caractère spécial (!@#$%^&*)
✅ **Indicateur de force du mot de passe** - Feedback visuel  
✅ **Emails stylisés** - Design cohérent avec PenguStream  

---

## 📁 Structure des fichiers

```
pengu-stream/
├── index.html                 # Page d'accueil
├── forgot-password.html       # Formulaire demande email
├── reset-password.html        # Page réinitialisation sécurisée
├── server.js                  # Backend Node.js/Express
├── package.json              # Dépendances npm
├── .env.example              # Template variables d'environnement
├── .env                       # Variables d'environnement (GITIGNORE)
└── README.md                 # Ce fichier
```

---

## 🚀 Installation

### 1️⃣ Cloner le repository

```bash
git clone https://github.com/aaripotere1256/pengu-stream.git
cd pengu-stream
```

### 2️⃣ Installer les dépendances

```bash
npm install
```

### 3️⃣ Configurer les variables d'environnement

Copier le fichier `.env.example` en `.env` :

```bash
cp .env.example .env
```

**Éditer `.env` avec vos configurations :**

```env
# ══ BREVO CONFIGURATION ══
BREVO_EMAIL=votre-email@brevo.com
BREVO_API_KEY=votre-api-key-brevo
BREVO_SENDER_EMAIL=noreply@pengustream.com

# ══ DATABASE ══
MONGODB_URI=mongodb://localhost:27017/pengustream

# ══ JWT ══
JWT_SECRET=une-clé-secrète-très-sécurisée-change-en-production

# ══ SERVER ══
PORT=3000
BASE_URL=http://localhost:3000

# ══ NODE ENVIRONMENT ══
NODE_ENV=development
```

### 4️⃣ Configurer Brevo

1. Créer un compte sur [Brevo](https://www.brevo.com)
2. Aller dans **Paramètres → SMTP et API**
3. Générer une **clé API SMTP**
4. Copier l'email et la clé dans `.env`

### 5️⃣ Configurer MongoDB

```bash
# Installer MongoDB localement ou utiliser MongoDB Atlas
# Pour MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/pengustream?retryWrites=true&w=majority
```

### 6️⃣ Démarrer le serveur

**Mode développement** (avec auto-reload):
```bash
npm run dev
```

**Mode production**:
```bash
npm start
```

Le serveur démarre sur `http://localhost:3000`

---

## 🔐 Points d'accès (Endpoints)

### 1. **POST** `/api/forgot-password`
Demande de réinitialisation de mot de passe

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Email de réinitialisation envoyé. Consultez votre boîte mail."
}
```

---

### 2. **POST** `/api/verify-reset-token`
Vérifie la validité d'un token

**Request:**
```json
{
  "token": "token-sécurisé-32bytes"
}
```

**Response (200):**
```json
{
  "message": "Token valide"
}
```

**Response (400):**
```json
{
  "message": "Token invalide ou expiré"
}
```

---

### 3. **POST** `/api/reset-password`
Réinitialise le mot de passe

**Request:**
```json
{
  "token": "token-sécurisé",
  "password": "NewPassword123!@"
}
```

**Response (200):**
```json
{
  "message": "Mot de passe réinitialisé avec succès"
}
```

---

### 4. **POST** `/api/register` (Bonus)
Crée un nouvel utilisateur

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!@"
}
```

---

### 5. **POST** `/api/login` (Bonus)
Authentifie un utilisateur

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!@"
}
```

**Response (200):**
```json
{
  "message": "Connexion réussie",
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  }
}
```

---

## 🎨 Pages Web

### 📄 `forgot-password.html`
- Demande simple de l'email utilisateur
- Validation côté client
- Message de succès/erreur
- Lien vers l'accueil

### 📄 `reset-password.html`
- Extraction du token depuis l'URL (`?token=xxx`)
- Vérification du token avant affichage du formulaire
- Indicateur de force du mot de passe en temps réel
- Affichage des critères de sécurité
- Confirmation du mot de passe
- Page de succès avec redirection auto

---

## 🔒 Sécurité

✅ **Tokens sécurisés** - 32 bytes cryptographiques aléatoires  
✅ **Expiration tokens** - 15 minutes maximum  
✅ **Hachage bcrypt** - Mots de passe hashés avec salt  
✅ **Validation côté serveur** - Vérification stricte des critères  
✅ **CORS activé** - Protection contre les requêtes non autorisées  
✅ **JWT pour authentification** - Tokens stateless  
✅ **Emails sécurisés** - Lien unique non-devinable  

---

## 📧 Template Email Brevo

L'email contient:
- Bouton "Réinitialiser mon mot de passe" cliquable
- Lien copie-collez en backup
- ⏰ Avertissement d'expiration (15 min)
- Design cohérent avec PenguStream
- Mention de sécurité si non autorisé

---

## 🛠️ Troubleshooting

### ❌ "Erreur de connexion"
```bash
# Vérifier que le serveur Node.js démarre
npm start
# Vérifier le port 3000 n'est pas occupé
lsof -i :3000
```

### ❌ "Email non reçu"
```bash
# Vérifier les credentials Brevo
# Tester la connexion SMTP:
# - BREVO_EMAIL correct ?
# - BREVO_API_KEY valide ?
# - Port 587 ouvert ?
```

### ❌ "Token invalide ou expiré"
```bash
# Token expire après 15 minutes
# Demander un nouveau lien
# Vérifier l'horloge serveur
```

### ❌ "Mot de passe ne respecte pas les critères"
```
Critères requis:
✓ Au moins 8 caractères
✓ Une MAJUSCULE
✓ Un CHIFFRE (0-9)
✓ Un caractère spécial (!@#$%^&*)

Exemple valide: SecurePass123!@
```

---

## 🧪 Test en local

1. **Accéder à la page:**
   ```
   http://localhost:3000/forgot-password.html
   ```

2. **Entrer un email test:**
   ```
   test@example.com
   ```

3. **Vérifier la réception du mail** (via Brevo inbox)

4. **Cliquer le lien** de réinitialisation

5. **Créer un nouveau mot de passe:**
   ```
   SecurePass123!@
   ```

6. **Succès!** ✓

---

## 📦 Dépendances principales

| Package | Version | Rôle |
|---------|---------|------|
| express | ^4.18.2 | Framework HTTP |
| cors | ^2.8.5 | Gestion CORS |
| dotenv | ^16.3.1 | Variables d'environnement |
| bcrypt | ^5.1.1 | Hachage mots de passe |
| jsonwebtoken | ^9.1.0 | JWT authentication |
| nodemailer | ^6.9.7 | Envoi emails |
| mongoose | ^7.6.3 | ORM MongoDB |

---

## 🚢 Déploiement

### Déployer sur Heroku

```bash
# 1. Login Heroku
heroku login

# 2. Créer l'app
heroku create pengustream-password-reset

# 3. Ajouter les variables d'environnement
heroku config:set BREVO_EMAIL=xxx
heroku config:set BREVO_API_KEY=xxx
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set JWT_SECRET=super-secret-key
heroku config:set BASE_URL=https://pengustream-password-reset.herokuapp.com

# 4. Déployer
git push heroku main
```

### Déployer sur Vercel (Frontend uniquement)

```bash
# Les pages HTML peuvent être statiques sur Vercel
# Mais le backend Node.js doit être sur Heroku/Railway/etc.
vercel --prod
```

---

## 📝 Licence

MIT © 2024 aaripotere1256

---

## 👨‍💻 Auteur

**aaripotere1256** - [GitHub](https://github.com/aaripotere1256)

---

## 🐧 Rejoignez PenguStream!

[Site officiel](https://pengustream.com) | [Discord](https://discord.gg/pengustream)

**"Le Streaming Glacial"** ❄️🐧
