// Third Parties Imports

import express from 'express';

import { sessionCheckout, handleSuccessPayment } from './paymentController.js';

import { authenticate } from '../../../middlewares/auth/Authentication.js';
import { isAuthorized } from '../../../middlewares/auth/Authorization.js';
const router = express.Router();

router.post('/checkout-session', authenticate, sessionCheckout);
router.get('/success', handleSuccessPayment);

export default router;
