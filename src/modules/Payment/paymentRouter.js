// Third Parties Imports

import express from 'express';

import { sessionCheckout } from './paymentController.js';

import { authenticate } from '../../../middlewares/auth/Authentication.js';
import { isAuthorized } from '../../../middlewares/auth/Authorization.js';
const router = express.Router();

router.post('/checkout-session', authenticate, sessionCheckout);

export default router;
