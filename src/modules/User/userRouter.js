import express from 'express';
import {
  registerNewUser,
  uploadUserPhotos,
  resizeUserPhoto,
  uploadToCloud,
  getUser,
  viewProfile,
  setUserAvailability,
  updateUser,
  searchUser,
  getAllUsers,
  getAllInstructors,
  getAllClients,
  getUserById,
  filterHandler,
  updataUserImages,
  getAvailableInstructors,
  deleteUser,
} from '../User/userController.js';
import { authenticate } from '../../../middlewares/auth/Authentication.js';
import { isAuthorized } from '../../../middlewares/auth/Authorization.js';

const router = express.Router();
//Testing
router.get('/', getAllUsers);
router.get('/instractors', getAllInstructors); //get all instractors
router.get('/clients', getAllClients); //get all clients

router.post('/', registerNewUser);
router.get('/myProfile', authenticate, getUser);
router.get('/public/:userName', viewProfile);
router.get('/instructors', authenticate, getAvailableInstructors);
router.get(
  '/:userName/setAvailability',
  authenticate,
  isAuthorized,
  setUserAvailability
);
router.patch(
  '/:userName/update-info',
  authenticate,
  isAuthorized,
  uploadUserPhotos,
  updateUser
);
router.patch(
  '/:userName/update-img',
  authenticate,
  isAuthorized,
  uploadUserPhotos,
  resizeUserPhoto,
  uploadToCloud,
  updataUserImages
);

router.get('/search', searchUser);
router.post('/filter', filterHandler);
router.get('/:uid', getUserById);
router.get('/:userName/delete', authenticate, isAuthorized, deleteUser);
export default router;
