// User Controller

import { createUserValidation } from './userValidation.js';
import AppError from '../../../middlewares/error/appError.js';
import Response from '../../../middlewares/utils/response.js';
import catchAsync from '../../../middlewares/utils/catchAsync.js';
import upload from '../../../middlewares/services/uploads/multer.js';
import uploadFileToCloudMiddleware from '../../../middlewares/services/uploads/uploadToCloud.js';
import resizeImageMiddleware from '../../../middlewares/services/uploads/resizeImage.js';
import prisma from '../../../Database/prisma/prismaClient.js';
import argon from 'argon2';
import { createToken } from '../../../middlewares/auth/Authentication.js';
import { getTopicByName } from '../Topics/topicController.js';

/**
 * @desc    Upload Photo Middleware
 */
export const uploadUserPhotos = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
]);
/**
 * @desc    Resize Image Using sharp
 */
export const resizeUserPhoto = resizeImageMiddleware(200, 200);
/**
 * @desc    Upload Photo Middleware
 */
export const uploadToCloud = uploadFileToCloudMiddleware;
/**
 * @desc    Register An User
 * @route   POST /api/user
 * @access   Public
 */
export const registerNewUser = catchAsync(async (req, res, next) => {
  // Extract Info from request body
  const { firstName, lastName, email, handler, password, gender } = req.body;

  // Validate Info
  const { error, value } = createUserValidation.validate({
    firstName,
    lastName,
    email,
    handler,
    password,
  });

  if (error) return next(new AppError(error, 400));

  //   Hash password
  const hashedPassword = await argon.hash(password);

  const tempPhoto =
    gender == 'male'
      ? 'https://png.pngtree.com/png-clipart/20200224/original/pngtree-cartoon-color-simple-male-avatar-png-image_5230557.jpg'
      : 'https://png.pngtree.com/png-clipart/20190904/original/pngtree-circular-pattern-user-cartoon-avatar-png-image_4492893.jpg';
  // create New User
  const newUser = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      handler,
      password: hashedPassword,
      gender,
      photo:
        'https://png.pngtree.com/png-clipart/20210915/ourlarge/pngtree-user-avatar-login-interface-abstract-blue-icon-png-image_3917504.jpg',
    },
  });

  delete newUser.password;
  // create new token
  const token = createToken(newUser);
  if (!token) return next(new AppError('Something Went Wrong!'), 500);

  if (process.env.NODE_ENV == 'production') {
    res.cookie('a_token', token, {
      httpOnly: true, // Helps protect against cross-site scripting (XSS) attacks
      secure: true, // Set to 'true' if using HTTPS
      sameSite: 'Strict', // Protects against cross-site request forgery (CSRF) attacks
      maxAge: 3600000, // Cookie expiration time in milliseconds (e.g., 1 hour)
    });
  }
  // sign user in
  // Send Welcome Email
  // ..........
  // Send Response with created Token
  Response(res, 'User Logged in successfully.', 200, { newUser, token });
});
/**
 * @desc    Update An User
 * @route   PATCH /api/user/:userName/update
 * @access   Public
 */
export const updateUser = catchAsync(async (req, res, next) => {
  console.log('🚀 ~ file: userController.js:90 ~ updateUser ~ req:', req.body);
  // Extract User info from request
  let {
    firstName,
    lastName,
    email,
    handler,
    phone,
    jobTitle,
    bio,
    country,
    experience,
    hourlyRate,
    topics,
  } = req.body;

  // Cannot update password using this endpoint
  if (req.body.password)
    return next('Cannot update user password using this endpoint!', 400);
  // Validate Info

  const { error, value } = createUserValidation.validate({
    firstName,
    lastName,
    email,
    handler,
    phone,
    jobTitle,
    bio,
    country,
    experience,
    hourlyRate,
  });

  const reqCopy = req.body;

  if (reqCopy.topics) {
    if (!(topics instanceof Array)) {
      topics = [topics];
    }

    const userSelectedTopics = [];

    for (const topic of topics) {
      const foundedTopic = await getTopicByName(topic);

      if (!foundedTopic) throw new AppError(`Invalid topic ${topic}!`, 404);

      userSelectedTopics.push(foundedTopic.id);
    }

    await prisma.userTopics.deleteMany({
      where: {
        userId: req.user.id,
      },
    });

    const userTopics = [];
    for (const userTopic of userSelectedTopics) {
      userTopics.push({
        userId: req.user.id,
        topicId: userTopic,
      });
    }

    await prisma.userTopics.createMany({
      data: userTopics,
    });
    delete reqCopy.topics;
  }

  if (reqCopy.hourlyRate) reqCopy.hourlyRate = reqCopy.hourlyRate * 1;

  // Update User info
  const updatedUser = await prisma.user.update({
    where: {
      handler: req.params.userName,
    },
    data: {
      ...reqCopy,
    },
    include: { topics: true },
  });

  // Send Response

  Response(res, 'User Updated Successfully.', 200, updatedUser);
});

/**
 * @desc    Get ALL User
 * @route   GET /api/user
 * @access   Public
 */
export const getAllUsers = catchAsync(async (req, res, next) => {
  const allUsers = await prisma.user.findMany({
    include: { topics: true },
  });

  Response(res, 'All Users', 200, allUsers);
});

/**
 * @desc    Get An User
 * @route   GET /api/user/:userName
 * @access   Public
 */
export const getUser = catchAsync(async (req, res, next) => {
  // Get User Name From parameters
  const { handler } = req.user;

  // Fetch User Info from database
  let userTarget = await prisma.user.findUnique({
    where: {
      handler: handler,
    },
    include: { topics: true },
  });
  if (!userTarget)
    return next(new AppError('No user found with that userName!', 400));

  /**
   * If user is client, execlude teacher fields from response
   * else return the Whole response
   */

  if (userTarget.isInstructor)
    return Response(res, 'Instructor Info.', 200, userTarget);
  // Client Info
  userTarget = {
    id: userTarget.id,
    firstName: userTarget.firstName,
    lastName: userTarget.lastName,
    bio: userTarget.bio,
    photo: userTarget.photo,
    coverImage: userTarget.coverImage,
    country: userTarget.country,
    // handler: userTarget.handler,
    // email: userTarget.email,
    // phone: userTarget.phone,
    // NID_Verified: userTarget.NID_Verified,
  };
  Response(res, 'Client Info.', 200, userTarget);
});
export const viewProfile = catchAsync(async (req, res, next) => {
  // Get User Name From parameters
  const { userName } = req.params;
  // Fetch User Info from database
  let userTarget = await prisma.user.findUnique({
    where: {
      handler: userName,
    },
    include: { topics: true },
  });

  if (!userTarget)
    return next(new AppError('No user found with that userName!', 400));
  if (userTarget.isInstructor) {
    userTarget = {
      id: userTarget.id,
      firstName: userTarget.firstName,
      lastName: userTarget.lastName,
      jobTitle: userTarget.jobTitle,
      bio: userTarget.bio,
      topics: userTarget.topics,
      photo: userTarget.photo,
      coverImage: userTarget.coverImage,
      hourlyRate: userTarget.hourlyRate,
      rating: userTarget.rating,
      country: userTarget.country,
      // handler: userTarget.handler,
      // email: userTarget.email,
      // phone: userTarget.phone,
      // NID_Verified: userTarget.NID_Verified,
    };
    return Response(res, 'Instructor Info.', 200, userTarget);
  } else {
    userTarget = {
      id: userTarget.id,
      firstName: userTarget.firstName,
      lastName: userTarget.lastName,
      // jobTitle: userTarget.jobTitle,
      bio: userTarget.bio,
      topics: userTarget.topics,
      photo: userTarget.photo,
      coverImage: userTarget.coverImage,
      country: userTarget.country,
      // handler: userTarget.handler,
      // email: userTarget.email,
      // phone: userTarget.phone,
      // NID_Verified: userTarget.NID_Verified,
    };

    Response(res, 'Client Info.', 200, userTarget);
  }
});
/**
 * @desc    Delete An User
 * @route   DELETE /api/user/:id
 * @access   Admin
 */
export const deleteUser = catchAsync(async (req, res, next) => {});
/**
 * @desc    Set User Availability
 * @route   GET /api/user/:userName/set-availabilty
 * @access   Public
 */
export const setUserAvailability = catchAsync(async (req, res, next) => {
  // Get User Name From parameters
  const { userName } = req.params;

  // Fetch User Info from database
  let userTarget = await prisma.user.findUnique({
    where: {
      handler: userName,
    },
  });
  if (!userTarget)
    return next(new AppError('No user found with that userName!', 400));

  await prisma.user.update({
    where: {
      handler: userName,
    },
    data: { availability: !userTarget.availability },
  });
  Response(res, 'User Availability Set To True.', 200, {
    userAvailability: !userTarget.availability,
  });
});
/**
 * @desc    Get User Availability
 * @route   GET /api/user/:userName/availabilty
 * @access   Public
 */
export const getUserAvailability = catchAsync(async (req, res, next) => {
  // Get User Name From parameters
  const { userName } = req.params;

  // Fetch User Info from database
  let userTarget = await prisma.user.findUnique({
    where: {
      handler: userName,
    },
  });
  if (!userTarget)
    return next(new AppError('No user found with that userName!', 400));

  Response(res, 'User Availability Response.', 200, {
    userAvailability: userTarget.availability,
  });
});

export const filterHandler = async (req, res, next) => {
  let userList = [];
  let usersPool = [];

  const [{ sorting }, { topics }, { country }, { gender }] = req.body.filters;
  console.log(
    '🚀 ~ file: userController.js:348 ~ filterHandler ~ gender:',
    req.body.filters
  );
  // const [{ sorting }, { topics }, { country }, { gender }] = [
  //   { sorting: [] },
  //   { topics: [] },
  //   { country: [] },
  //   { gender: [''] },
  // ];

  if (
    sorting.length == 0 &&
    topics.length == 0 &&
    country.length == 0 &&
    gender.length == 0
  )
    return Response(res, 'Filter Result', 200, await prisma.user.findMany());

  if (!req.body.users) usersPool = await prisma.user.findMany();
  else usersPool = req.body.users;

  console.log(usersPool);
  for (const user of usersPool) {
    userList.push(user.id);
  }

  console.log(req.body.filters);

  const filterResult = new Set();

  if (topics.length > 0) {
    for (const topic of topics) {
      const topicFounded = await prisma.topic.findFirst({
        where: { name: topic },
      });

      if (topicFounded) {
        let usersWithThisTopic;
        if (userList.length > 0) {
          usersWithThisTopic = await prisma.userTopics.findMany({
            where: {
              topicId: topicFounded.id,
              userId: { in: userList },
            },
            select: { userId: true },
          });
        } else {
          usersWithThisTopic = await prisma.userTopics.findMany({
            where: {
              topicId: topicFounded.id,
            },
            select: { userId: true },
          });
        }

        if (usersWithThisTopic.length > 0) {
          for (const user of usersWithThisTopic) {
            filterResult.add(user.userId);
          }
        }
      }
    }
  }

  if (country.length > 0) {
    let countryResult;
    if (filterResult.size > 0) {
      countryResult = await prisma.user.findMany({
        where: {
          AND: [{ id: { in: filterResult } }, { country: { in: country } }],
        },
        select: { id: true },
      });
      filterResult.clear();
    } else {
      if (userList.length > 0) {
        countryResult = await prisma.user.findMany({
          where: {
            AND: [{ id: { in: userList } }, { country: { in: country } }],
          },
          select: { id: true },
        });
      } else {
        countryResult = await prisma.user.findMany({
          where: { country: { in: country } },
          select: { id: true },
        });
      }
    }
    for (const counResult of countryResult) {
      filterResult.add(counResult.id);
    }
  }
  console.log(
    '🚀 ~ file: userController.js:502 ~ filterHandler countryResult:',
    filterResult
  );

  if (gender.length > 0) {
    let genderResult;
    if (!gender.includes('')) {
      if (filterResult.size > 0) {
        genderResult = await prisma.user.findMany({
          where: {
            AND: [
              { id: { in: [...filterResult] } },
              { gender: { in: gender } },
            ],
          },
          select: { id: true },
        });
        console.log(
          '🚀 ~ file: userController.js:466 ~ filterHandler ~ genderResult:',
          genderResult
        );
        filterResult.clear();
      } else {
        if (userList.length > 0) {
          genderResult = await prisma.user.findMany({
            where: {
              AND: [{ id: { in: userList } }, { gender: { in: gender } }],
            },
            select: { id: true },
          });
        } else {
          genderResult = await prisma.user.findMany({
            where: { gender: { in: gender } },
            select: { id: true },
          });
        }
      }
      for (const genResult of genderResult) {
        filterResult.add(genResult.id);
      }
    }
  }
  console.log(
    '🚀 ~ file: userController.js:502 ~ filterHandler  genderResult:',
    filterResult
  );

  if (sorting.length > 0) {
    for (const sortValue of sorting) {
      if (sortValue == 'lowest hourly rate') {
        const sortResult = await sortUsers(
          [...filterResult],
          'hourlyRate',
          'asc'
        );

        filterResult.clear();
        for (const sortRes of sortResult) {
          filterResult.add(sortRes);
        }
      }
      if (sortValue == 'highest hourly rate') {
        const sortResult = await sortUsers(
          [...filterResult],
          'hourlyRate',
          'desc'
        );
        filterResult.clear();
        for (const sortRes of sortResult) {
          filterResult.add(sortRes);
        }
      }
      if (sortValue == 'highest review') {
        const sortResult = await sortUsers([...filterResult], 'review', 'desc');
        filterResult.clear();
        for (const sortRes of sortResult) {
          filterResult.add(sortRes);
        }
      }
      if (sortValue == 'highest availability') {
        const sortResult = await sortUsers(
          [...filterResult],
          'availability',
          'desc'
        );
        filterResult.clear();
        for (const sortRes of sortResult) {
          filterResult.add(sortRes);
        }
      }
      if (sortValue == 'highest experience') {
        const sortResult = sortUsers([...filterResult], 'experience', 'desc');
        filterResult.clear();
        for (const sortRes of sortResult) {
          filterResult.add(sortRes);
        }
      }
    }
  }
  console.log(
    '🚀 ~ file: userController.js:502 ~ filterHandler  sortResult:',
    filterResult
  );

  const usersFilterResult = await prisma.user.findMany({
    where: {
      id: { in: [...filterResult] },
    },
  });
  Response(res, 'Filter Result', 200, usersFilterResult);
};
// filterHandler();

const sortUsers = async (userList, field, sortingType) => {
  let users = await prisma.user.findMany({
    where: {
      id: { in: userList },
    },
    orderBy: { [field]: sortingType },
  });

  return users;
};

export const searchUser = catchAsync(async (req, res, next) => {
  const searchResult = [];
  const query = req.query['k'];

  // Usernames, handler, topics , title
  const foundedUser = await prisma.user.findMany({
    where: {
      OR: [
        {
          firstName: { contains: query, mode: 'insensitive' },
        },
        { lastName: { contains: query, mode: 'insensitive' } },
        { handler: { contains: query, mode: 'insensitive' } },
        { jobTitle: { contains: query, mode: 'insensitive' } },
      ],
    },
  });

  Response(res, 'Search Result', 200, foundedUser);
});

export const getUserById = catchAsync(async (req, res, next) => {
  const userId = req.params.uid;
  const foundedUser = await prisma.user.findUnique({ where: { id: userId } });

  if (!foundedUser)
    return next(new AppError('No User found with this id', 404));

  Response(res, 'User Found.', 200, foundedUser);
});

export const updataUserImages = catchAsync(async (req, res, next) => {
  // Update User info
  const updatedUser = await prisma.user.update({
    where: {
      handler: req.params.userName,
    },
    data: {
      photo: req.userProfileImage,
      coverImage: req.userCoverImage,
    },
  });

  // Send Response

  Response(res, 'User Updated Successfully.', 200, updatedUser);
});

export const getAvaialableInstructors = catchAsync(async (req, res, next) => {
  const availableInstructors = await prisma.user.findMany({
    where: {
      availability: true,
    },
  });

  if (!availableInstructors)
    return next(new AppError('No available Instructors!', 404));

  Response(res, 'Available Instructors', 200, availableInstructors);
});
