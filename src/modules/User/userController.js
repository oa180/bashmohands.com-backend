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
import { ApiFeatures } from '../../../middlewares/utils/api-featuresjs.js';
import { emailSender } from '../../../middlewares/services/Email/mail.js';
import { paginate } from '../../../middlewares/utils/paginateFilters.js';

export const getAllUsers = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(
    prisma.user.findMany({
      where: {
        role: { not: 'ADMIN' },
      },
      include: { topics: true },
      // where:{
      //   NOT:{role:'ADMIN'}
      // },
      // include: { topics: true },
    }),
    req.query
  ).paginate();
  const allUsers = (await features).prismaQuery;
  Response(res, 'All Users', 200, allUsers);
});
export const getAllInstructors = catchAsync(async (req, res, next) => {
  // Fetch User Info from database
  let userTarget = await prisma.user.findMany({
    where: {
      OR: [{ isInstructor: true }, { role: 'INSTRUCTOR' }],
    },
    include: { topics: true },
  });
  if (!userTarget) return next(new AppError('No Instructors yet!', 400));
  Response(res, 'Instructors Info.', 200, userTarget);
});
export const getAllClients = catchAsync(async (req, res, next) => {
  // Fetch User Info from database
  let userTarget = await prisma.user.findMany({
    where: {
      AND: [{ isInstructor: false }, { role: 'CLIENT' }],
    },
  });
  if (!userTarget) return next(new AppError('No Clients yet!', 400));
  Response(res, 'Clients Info.', 200, userTarget);
});

export const registerNewUser = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, handler, password, gender } = req.body;
  const { error, value } = createUserValidation.validate({
    firstName,
    lastName,
    email,
    handler,
    password,
    // gender,
  });
  if (error) return next(new AppError(error, 400));
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
      // gender,
      photo: tempPhoto,
    },
  });
  delete newUser.password;
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
  emailSender('welcome email', email, firstName);
  Response(res, 'User Logged in successfully.', 200, { newUser, token });
});
export const getUser = catchAsync(async (req, res, next) => {
  const { handler } = req.user;
  let userTarget = await prisma.user.findUnique({
    where: { handler: handler },
    include: { topics: true },
  });
  if (!userTarget)
    return next(new AppError('No user found with that userName!', 400));
  if (userTarget.role == 'INSTRUCTOR')
    return Response(res, 'Instructor Info.', 200, userTarget);
  // userTarget = {
  //   id: userTarget.id,
  //   firstName: userTarget.firstName,
  //   lastName: userTarget.lastName,
  //   bio: userTarget.bio,
  //   photo: userTarget.photo,
  //   coverImage: userTarget.coverImage,
  //   country: userTarget.country,
  //   handler: userTarget.handler,
  //   email: userTarget.email,
  //   phone: userTarget.phone,
  // };
  Response(res, 'Client Info.', 200, userTarget);
});
export const viewProfile = catchAsync(async (req, res, next) => {
  const { userName } = req.params;
  let userTarget = await prisma.user.findUnique({
    where: { handler: userName },
    include: { topics: true },
  });
  if (!userTarget)
    return next(new AppError('No user found with that userName!', 400));

  Response(res, 'User Info.', 200, userTarget);
});

export const getAvailableInstructors = catchAsync(async (req, res, next) => {
  const availableInstructors = await prisma.user.findMany({
    where: {
      AND: [{ role: 'INSTRUCTOR' }, { availability: true }],
    },
  });
  if (!availableInstructors)
    return next(new AppError('No available Instructors!', 404));
  Response(res, 'Available Instructors.', 200, availableInstructors);
});
export const setUserAvailability = catchAsync(async (req, res, next) => {
  const { userName } = req.params;
  await prisma.user.update({
    where: { handler: userName },
    data: { availability: !userTarget.availability },
  });
  Response(res, 'User Availability Set To True.', 200, {
    userAvailability: !userTarget.availability,
  });
});
export const updateUser = catchAsync(async (req, res, next) => {
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
  if (req.body.password)
    return next('Cannot update user password using this endpoint!', 400);
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
    await prisma.userTopics.deleteMany({ where: { userId: req.user.id } });
    const userTopics = [];
    for (const userTopic of userSelectedTopics) {
      userTopics.push({
        userId: req.user.id,
        topicId: userTopic,
      });
    }
    await prisma.userTopics.createMany({ data: userTopics });
    delete reqCopy.topics;
  }
  if (reqCopy.hourlyRate) reqCopy.hourlyRate = reqCopy.hourlyRate * 1;
  // Update User info
  const updatedUser = await prisma.user.update({
    where: { handler: req.params.userName },
    data: { ...reqCopy },
    include: { topics: true },
  });
  Response(res, 'User Updated Successfully.', 200, updatedUser);
});
export const updataUserImages = catchAsync(async (req, res, next) => {
  const updatedUser = await prisma.user.update({
    where: { handler: req.params.userName },
    data: {
      photo: req.userProfileImage,
      coverImage: req.userCoverImage,
    },
  });
  Response(res, 'User Updated Successfully.', 200, updatedUser);
});
export const searchUser = catchAsync(async (req, res, next) => {
  const searchResult = [];
  const query = req.query['k'];
  const foundedUser = await prisma.user.findMany({
    where: {
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { handler: { contains: query, mode: 'insensitive' } },
        { jobTitle: { contains: query, mode: 'insensitive' } },
      ],
    },
  });
  Response(res, 'Search Result', 200, foundedUser);
});

export const filterHandler = catchAsync(async (req, res, next) => {
  let userList = [];
  let usersPool = [];
  const [
    { sorting },
    { topics },
    { country },
    { gender },
    // { query },
    // { isInstructor },
  ] = req.body.filters;

  if (
    sorting.length == 0 &&
    topics.length == 0 &&
    country.length == 0 &&
    gender.length == 0
    //  &&
    // !query &&
    // isInstructor == ''
  )
    return Response(
      res,
      'Filter Result',
      200,
      paginate(req, await prisma.user.findMany())
    );
  if (!req.body.users) usersPool = await prisma.user.findMany();
  else usersPool = req.body.users;
  for (const user of usersPool) {
    userList.push(user.id);
  }
  const filterResult = new Set();

  // if (query) {
  //   let queryResult = [];

  //   if (userList.length > 0) {
  //     queryResult = await prisma.user.findMany({
  //       where: {
  //         AND: [
  //           { id: { in: userList } },
  //           {
  //             OR: [
  //               { firstName: { contains: query, mode: 'insensitive' } },
  //               { lastName: { contains: query, mode: 'insensitive' } },
  //               { handler: { contains: query, mode: 'insensitive' } },
  //               { jobTitle: { contains: query, mode: 'insensitive' } },
  //             ],
  //           },
  //         ],
  //       },
  //     });
  //   } else {
  //     queryResult = await prisma.user.findMany({
  //       where: {
  //         OR: [
  //           { firstName: { contains: query, mode: 'insensitive' } },
  //           { lastName: { contains: query, mode: 'insensitive' } },
  //           { handler: { contains: query, mode: 'insensitive' } },
  //           { jobTitle: { contains: query, mode: 'insensitive' } },
  //         ],
  //       },
  //     });
  //   }

  //   if (queryResult.length > 0) {
  //     for (const user of queryResult) {
  //       filterResult.add(user.id);
  //     }
  //   }
  //   console.log(
  //     '🚀 ~ file: userController.js:306 ~ filterHandler ~ query:',
  //     filterResult
  //   );
  // }

  // if (isInstructor == true) {
  //   let instructors = [];

  //   if (filterResult.size > 0) {
  //     instructors = await prisma.user.findMany({
  //       where: {
  //         AND: [
  //           { id: { in: [...filterResult] } },
  //           { role: 'INSTRUCTOR' },
  //           { availability: true },
  //         ],
  //       },
  //     });
  //     console.log(
  //       '🚀 ~ file: userController.js:327 ~ filterHandler ~ instructors:',
  //       instructors
  //     );
  //     filterResult.clear();
  //   } else {
  //     if (userList.length > 0) {
  //       instructors = await prisma.user.findMany({
  //         where: {
  //           AND: [
  //             { id: { in: userList } },
  //             { role: 'INSTRUCTOR' },
  //             { availability: true },
  //           ],
  //         },
  //       });
  //     } else {
  //       instructors = await prisma.user.findMany({
  //         where: {
  //           AND: [{ role: 'INSTRUCTOR' }, { availability: true }],
  //         },
  //       });
  //     }
  //   }

  //   if (instructors.length > 0) {
  //     for (const user of instructors) {
  //       filterResult.add(user.id);
  //     }
  //   }
  //   console.log(
  //     '🚀 ~ file: userController.js:347 ~ filterHandler ~ instructor:',
  //     filterResult
  //   );
  // }

  if (topics.length > 0) {
    for (const topic of topics) {
      const topicFounded = await prisma.topic.findFirst({
        where: { name: topic },
      });
      if (topicFounded) {
        let usersWithThisTopic;
        if (filterResult.size > 0) {
          usersWithThisTopic = await prisma.userTopics.findMany({
            where: {
              topicId: topicFounded.id,
              userId: { in: [...filterResult] },
            },
            select: { userId: true },
          });
          filterResult.clear();
        } else {
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
              where: { topicId: topicFounded.id },
              select: { userId: true },
            });
          }
        }
        if (usersWithThisTopic.length > 0) {
          for (const user of usersWithThisTopic) {
            filterResult.add(user.userId);
          }
        }
      }
    }
    console.log(
      '🚀 ~ file: userController.js:277 ~ filterHandler ~ topics:',
      filterResult
    );
  }

  if (country.length > 0) {
    let countryResult;
    if (filterResult.size > 0) {
      countryResult = await prisma.user.findMany({
        where: {
          AND: [
            { id: { in: [...filterResult] } },
            { country: { in: country } },
          ],
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
    console.log(
      '🚀 ~ file: userController.js:316 ~ filterHandler ~ country:',
      filterResult
    );
  }

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
        filterResult.clear();
      } else {
        if (userList.length > 0 && topics.length == 0 && country.length == 0) {
          genderResult = await prisma.user.findMany({
            where: {
              AND: [{ id: { in: userList } }, { gender: { in: gender } }],
            },
            select: { id: true },
          });
        } else {
          genderResult = [...filterResult];
        }
      }
      for (const genResult of genderResult) {
        filterResult.add(genResult.id);
      }
    }
    console.log(
      '🚀 ~ file: userController.js:348 ~ filterHandler ~ gender:',
      filterResult
    );
  }

  if (sorting.length > 0) {
    if (
      filterResult.size == 0 &&
      (gender.length > 0 || country.length > 0 || topics.length > 0)
    ) {
      return Response(res, 'Filter Result', 200, [...filterResult]);
    }
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
        const sortResult = await sortUsers([...filterResult], 'rating', 'desc');
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
        const sortResult = await sortUsers(
          [...filterResult],
          'experience',
          'desc'
        );
        filterResult.clear();
        for (const sortRes of sortResult) {
          filterResult.add(sortRes);
        }
      }
      if (sortValue == 'name A-Z') {
        const sortResult = await sortUsers(
          [...filterResult],
          'firstName',
          'asc'
        );
        filterResult.clear();

        for (const sortRes of sortResult) {
          filterResult.add(sortRes);
        }
      }
      if (sortValue == 'name Z-A') {
        const sortResult = await sortUsers(
          [...filterResult],
          'firstName',
          'desc'
        );
        filterResult.clear();

        for (const sortRes of sortResult) {
          filterResult.add(sortRes);
        }
      }
    }
  }

  if (sorting.length > 0) {
    return Response(
      res,
      'Filter Result',
      200,
      paginate(req, [...filterResult])
    );
  }

  const usersFilterResult = await prisma.user.findMany({
    where: { id: { in: [...filterResult] } },
  });

  Response(res, 'Filter Result', 200, paginate(req, usersFilterResult));
});

export const getUserById = catchAsync(async (req, res, next) => {
  const userId = req.params.uid;
  const foundedUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!foundedUser)
    return next(new AppError('No User found with this id', 404));
  Response(res, 'User Found.', 200, foundedUser);
});
export const deleteUser = catchAsync(async (req, res, next) => {
  let user = await prisma.user.delete({
    where: { handler: req.user.handler },
  });
  return Response(res, 'User deleted successfully.', 200, user);
});
const sortUsers = async (userList, field, sortingType) => {
  let users;
  if (userList.length > 0) {
    users = await prisma.user.findMany({
      where: {
        id: { in: userList },
      },
      orderBy: { [field]: sortingType },
      // select: { id: true },
    });
  } else {
    users = await prisma.user.findMany({
      orderBy: { [field]: sortingType },
      // select: { id: true },
    });
  }

  return users;
};

export const uploadUserPhotos = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
]);
export const resizeUserPhoto = resizeImageMiddleware(200, 200);
export const uploadToCloud = uploadFileToCloudMiddleware;
