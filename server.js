const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

// ══ MIDDLEWARE ══
app.use(cors());
app.use(express.json());

// ══ DATABASE CONNECTION ══
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).catch(err => console.error('MongoDB connection error:', err));

// ══ DATABASE SCHEMA ══
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    resetToken: String,
    resetTokenExpiry: Date
});

const User = mongoose.model('User', userSchema);

// ══ BREVO EMAIL CONFIGURATION ══
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_EMAIL,
        pass: process.env.BREVO_API_KEY
    }
});

// ══ UTILITIES ══
function generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
}

function generateResetLink(token) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/reset-password.html?token=${token}`;
}

// ══ ROUTES ══

/**
 * POST /api/forgot-password
 * Envoie un email de réinitialisation de mot de passe
 */
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email requis' });
        }

        // Vérifier si l'utilisateur existe
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Répondre de la même façon pour des raisons de sécurité
            return res.status(200).json({ 
                message: 'Si cet email existe, vous recevrez un lien de réinitialisation' 
            });
        }

        // Générer un token sécurisé
        const resetToken = generateResetToken();
        const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Sauvegarder le token
        user.resetToken = resetToken;
        user.resetTokenExpiry = resetTokenExpiry;
        await user.save();

        // Générer le lien
        const resetLink = generateResetLink(resetToken);

        // Préparer l'email
        const mailOptions = {
            from: process.env.BREVO_SENDER_EMAIL || process.env.BREVO_EMAIL,
            to: email,
            subject: '🔐 Réinitialisation de votre mot de passe PenguStream',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: 'Nunito', Arial, sans-serif; background: #051e30; color: #fff; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 0 auto; background: rgba(5, 30, 48, 0.85); border-radius: 20px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); }
                        .header { background: linear-gradient(135deg, #17a589, #7b68ee); padding: 40px 20px; text-align: center; }
                        .header h1 { margin: 0; font-size: 2rem; }
                        .content { padding: 40px 30px; }
                        .content p { line-height: 1.6; color: rgba(255, 255, 255, 0.9); margin: 0 0 20px 0; }
                        .reset-button { display: inline-block; background: linear-gradient(135deg, #17a589, #0e7a62); color: #fff; padding: 14px 34px; border-radius: 50px; text-decoration: none; font-weight: 800; margin: 20px 0; }
                        .reset-button:hover { opacity: 0.9; }
                        .footer { background: rgba(184, 224, 247, 0.05); padding: 20px; text-align: center; font-size: 0.9rem; color: rgba(255, 255, 255, 0.5); border-top: 1px solid rgba(184, 224, 247, 0.1); }
                        .warning { background: rgba(243, 156, 18, 0.15); border-left: 4px solid #f39c12; padding: 12px; margin: 20px 0; border-radius: 4px; font-size: 0.9rem; color: rgba(255, 255, 255, 0.8); }
                        .code { background: rgba(184, 224, 247, 0.1); padding: 12px; border-radius: 6px; font-family: monospace; word-break: break-all; margin: 15px 0; color: #b8e0f7; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 Réinitialisation de mot de passe</h1>
                        </div>
                        <div class="content">
                            <p>Bonjour,</p>
                            <p>Vous avez demandé la réinitialisation de votre mot de passe PenguStream. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
                            
                            <a href="${resetLink}" class="reset-button">Réinitialiser mon mot de passe</a>
                            
                            <p>Ou copiez-collez ce lien dans votre navigateur :</p>
                            <div class="code">${resetLink}</div>
                            
                            <div class="warning">
                                ⏰ <strong>Important :</strong> Ce lien expire dans 15 minutes. Après cela, vous devrez demander un nouveau lien.
                            </div>
                            
                            <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre compte reste sécurisé.</p>
                            <p>Cordialement,<br><strong>L'équipe PenguStream</strong> 🐧</p>
                        </div>
                        <div class="footer">
                            <p>Cet email a été envoyé à <strong>${email}</strong></p>
                            <p>© ${new Date().getFullYear()} PenguStream. Tous droits réservés.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        // Envoyer l'email
        await transporter.sendMail(mailOptions);

        res.status(200).json({ 
            message: 'Email de réinitialisation envoyé. Consultez votre boîte mail.' 
        });

    } catch (error) {
        console.error('Erreur forgot-password:', error);
        res.status(500).json({ message: 'Erreur serveur. Réessayez plus tard.' });
    }
});

/**
 * POST /api/verify-reset-token
 * Vérifie la validité d'un token de réinitialisation
 */
app.post('/api/verify-reset-token', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'Token requis' });
        }

        // Chercher l'utilisateur avec ce token
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Token invalide ou expiré' });
        }

        res.status(200).json({ message: 'Token valide' });

    } catch (error) {
        console.error('Erreur verify-reset-token:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

/**
 * POST /api/reset-password
 * Réinitialise le mot de passe avec le token
 */
app.post('/api/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: 'Token et mot de passe requis' });
        }

        // Vérifier les critères de sécurité du mot de passe
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                message: 'Le mot de passe ne respecte pas les critères de sécurité' 
            });
        }

        // Trouver l'utilisateur avec ce token valide
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Token invalide ou expiré' });
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Mettre à jour le mot de passe et supprimer le token
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        // Envoyer un email de confirmation
        const mailOptions = {
            from: process.env.BREVO_SENDER_EMAIL || process.env.BREVO_EMAIL,
            to: user.email,
            subject: '✓ Votre mot de passe a été réinitialisé',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: 'Nunito', Arial, sans-serif; background: #051e30; color: #fff; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 0 auto; background: rgba(5, 30, 48, 0.85); border-radius: 20px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); }
                        .header { background: linear-gradient(135deg, #2ecc71, #27ae60); padding: 40px 20px; text-align: center; }
                        .header h1 { margin: 0; font-size: 2rem; }
                        .content { padding: 40px 30px; }
                        .content p { line-height: 1.6; color: rgba(255, 255, 255, 0.9); margin: 0 0 20px 0; }
                        .footer { background: rgba(184, 224, 247, 0.05); padding: 20px; text-align: center; font-size: 0.9rem; color: rgba(255, 255, 255, 0.5); border-top: 1px solid rgba(184, 224, 247, 0.1); }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>✓ Mot de passe réinitialisé</h1>
                        </div>
                        <div class="content">
                            <p>Bonjour,</p>
                            <p>Votre mot de passe PenguStream a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
                            <p>Si vous n'avez pas effectué cette action, contactez immédiatement notre support.</p>
                            <p>Cordialement,<br><strong>L'équipe PenguStream</strong> 🐧</p>
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} PenguStream. Tous droits réservés.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });

    } catch (error) {
        console.error('Erreur reset-password:', error);
        res.status(500).json({ message: 'Erreur serveur. Réessayez plus tard.' });
    }
});

/**
 * POST /api/register
 * Enregistre un nouvel utilisateur
 */
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email et mot de passe requis' });
        }

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer l'utilisateur
        const user = new User({
            email: email.toLowerCase(),
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({ message: 'Utilisateur créé avec succès' });

    } catch (error) {
        console.error('Erreur register:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

/**
 * POST /api/login
 * Authentifie un utilisateur
 */
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email et mot de passe requis' });
        }

        // Chercher l'utilisateur
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Comparer les mots de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Générer un JWT
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(200).json({ 
            message: 'Connexion réussie',
            token,
            user: { id: user._id, email: user.email }
        });

    } catch (error) {
        console.error('Erreur login:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// ══ ERROR HANDLER ══
app.use((err, req, res, next) => {
    console.error('Erreur non gérée:', err);
    res.status(500).json({ message: 'Erreur serveur interne' });
});

// ══ SERVER START ══
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✓ Serveur démarré sur le port ${PORT}`);
    console.log(`✓ Brevo Email: ${process.env.BREVO_EMAIL}`);
});

module.exports = app;
