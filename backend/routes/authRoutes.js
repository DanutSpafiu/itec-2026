import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';

const router = express.Router();

// Ruta efectivă va fi: POST http://localhost:3000/api/auth/register
router.post('/register', registerUser);

// Ruta efectivă va fi: POST http://localhost:3000/api/auth/login
router.post('/login', loginUser);

export default router;
