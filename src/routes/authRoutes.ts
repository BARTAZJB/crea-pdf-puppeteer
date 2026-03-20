import { Router } from 'express';
import { requestPasswordReset, resetPassword } from '../services/authService';

const router = Router();

// 1. POST /api/recover-password
router.post('/recover-password', async (req, res) => {
    try {
        const { email } = req.body;
        // Siempre devolvemos 200 para no revelar si el correo existe o no al público
        await requestPasswordReset(email); 
        res.json({ success: true, message: 'Si el correo existe, recibirás instrucciones.' });
    } catch (error) {
        console.error('Recover error:', error);
        res.status(500).json({ success: false, message: 'Error en servicio de recuperación' });
    }
});

// 2. POST /api/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        await resetPassword(token, newPassword); // Valida token y actualiza
        res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message || 'Error restableciendo contraseña' });
    }
});

export default router;
