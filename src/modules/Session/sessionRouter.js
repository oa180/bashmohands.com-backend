// Third Parties Imports

import express from 'express';

import { bookSession } from './sessionController.js';

import {
  authenticate,
  isMine,
} from '../../../middlewares/auth/Authentication.js';

const router = express.Router();

router.post('/book', bookSession);

export default router;
