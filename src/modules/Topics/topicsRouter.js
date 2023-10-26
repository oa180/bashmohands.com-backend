// Third Parties Imports

import express from 'express';

import { getAllTopics, createNewTopic } from './topicController.js';

import {
  authenticate,
  isMine,
} from '../../../middlewares/auth/Authentication.js';

const router = express.Router();

router.get('/', getAllTopics);

router.post('/new', authenticate, isMine, createNewTopic);

export default router;
