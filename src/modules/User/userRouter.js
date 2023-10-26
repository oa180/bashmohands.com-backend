// Third Parties Imports
import express from 'express';

// Local Imports
import {
  registerNewUser,
  uploadUserPhotos,
  resizeUserPhoto,
  uploadToCloud,
  getUser,
  viewProfile,
  getUserAvailability,
  setUserAvailability,
  updateUser,
  searchUser,
  getAllUsers,
  getUserById,
  filterHandler,
  updataUserImages,
  getAvaialableInstructors,
} from '../User/userController.js';
import {
  isMine,
  authenticate,
} from '../../../middlewares/auth/Authentication.js';
const router = express.Router();

/**
 * @desc    Create new User route
 * @route   POST /api/user
 * @access  Public
 */
router.post('/', registerNewUser).get('/', getAllUsers);
/**
 * @desc    Updatr User route
 * @route   PATCH POST /api/user/:userName/update
 * @access  User itself
 */
router.patch(
  '/:userName/update-info',
  authenticate,
  isMine,
  uploadUserPhotos,
  updateUser
);
/**
 * @desc    Get User Profile route
 * @route   POST /api/user/:userName
 * @access  Public
 */
router.get('/myProfile', authenticate, getUser);

router.get('/public/:userName', viewProfile);
/**
 * @desc    Set User Availability
 * @route   GET /api/user/:userName/set-availabilty
 * @access   Public
 */
router.get('/:userName/set-availability', setUserAvailability);
/**
 * @desc    Get User Availability
 * @route   GET /api/user/:userName/availabilty
 * @access   Public
 */
router.get('/:userName/availability', getUserAvailability);
router.get('/instructors', getAvaialableInstructors);
/**
 * @desc    Get User Availability
 * @route   GET /api/user/:userName/availabilty
 * @access   Public
 */
router.get('/search', searchUser);
router.post('/filter', filterHandler);
router.get('/:uid', getUserById);
router.patch(
  '/:userName/update-img',
  authenticate,
  isMine,
  uploadUserPhotos,
  resizeUserPhoto,
  uploadToCloud,
  updataUserImages
);

export default router;
