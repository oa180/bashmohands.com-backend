// Third Parties Imports

import express from 'express';

import { getAllTopics, createNewTopic } from './topicController.js';

import { authenticate } from '../../../middlewares/auth/Authentication.js';
import { isAuthorized } from '../../../middlewares/auth/Authorization.js';
const router = express.Router();

router.get('/', getAllTopics);

router.post('/new', authenticate, isAuthorized, createNewTopic);

export default router;
