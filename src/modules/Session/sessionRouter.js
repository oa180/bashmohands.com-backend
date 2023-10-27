// Third Parties Imports

import express from 'express';

import {
  bookSession,
  getUserSessions,
  getSessionById,
} from './sessionController.js';

import {
  authenticate,
  isMine,
} from '../../../middlewares/auth/Authentication.js';

const router = express.Router();

router.post('/book', bookSession);
router.get('/:handler', getUserSessions);
router.get('/:sid/info', authenticate, getSessionById);

export default router;
