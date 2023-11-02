// Imports
import express from 'express';
import {signIn,} from './authController.js';
// import {forgetPassword,register,signIn, forgotPassword,} from './authController.js';

// Router App
const router = express.Router();
router.post('/signin', signIn);
// router.post('/forget-password', forgotPassword);
// router.get('/resetPassword/:reset-token');
// router.post('/register', register);

export default router;
