import prisma from '../../../Database/prisma/prismaClient.js';
import AppError from '../../../middlewares/error/appError.js';
import catchAsync from '../../../middlewares/utils/catchAsync.js';
import Response from '../../../middlewares/utils/response.js';

export const bookSession = catchAsync(async (req, res, next) => {
  const { instructorHandler, clientHandler, notes, date, topics } = req.body;

  if (!instructorHandler || !clientHandler)
    return next(new AppError('Instructor or client ar messing', 400));

  const clientAndInstructorFound = await prisma.user.findMany({
    where: {
      OR: [
        {
          handler: instructorHandler,
        },
        {
          handler: clientHandler,
        },
      ],
    },
  });

  if (clientAndInstructorFound.length !== 2)
    return next(new AppError('Wrong instructor or client handler!', 404));

  let foundedTopics = await prisma.topic.findMany({
    where: { name: { in: topics } },
    select: { id: true },
  });

  if (foundedTopics.length !== topics.length)
    return next(new AppError('Wrong topic name!', 404));

  const topicIds = foundedTopics.map(topic => topic.id);

  console.log(topicIds);

  const d = new Date(Date.now());
  const session = await prisma.session.create({
    data: {
      instructorHandler,
      clientHandler,
      notes,
      date: d,
    },
  });

  for (const topicId of topicIds) {
    await prisma.sessionTopics.create({
      data: {
        seesionId: session.id,
        topicId,
      },
    });
  }

  Response(res, 'Session Booked', 200, session);
});

export const getUserSessions = catchAsync(async (req, res, next) => {
  const userHandler = req.params.handler;

  const userSessions = await prisma.session.findMany({
    where: {
      OR: [{ instructorHandler: userHandler }, { clientHandler: userHandler }],
    },
    include: {
      Client: { select: { firstName: true, lastName: true, photo: true } },
      Instructor: { select: { firstName: true, lastName: true, photo: true } },
    },
  });
  Response(res, 'User Sessions.', 200, userSessions);
});

export const getSessionById = catchAsync(async (req, res, next) => {
  const sessionId = req.params.sid;
  console.log(
    '🚀 ~ file: sessionController.js:79 ~ getSessionById ~ sessionId:',
    sessionId
  );

  const currentUserHandler = req.user.handler;
  console.log(
    '🚀 ~ file: sessionController.js:81 ~ getSessionById ~ currentUserHandler:',
    currentUserHandler
  );

  const foundedSession = await prisma.session.findUnique({
    where: {
      id: sessionId,
      OR: [
        { clientHandler: currentUserHandler },
        { instructorHandler: currentUserHandler },
      ],
    },
  });
  console.log(
    '🚀 ~ file: sessionController.js:91 ~ getSessionById ~ foundedSession:',
    foundedSession
  );

  if (!foundedSession) return next(new AppError('Session not found!', 404));

  Response(res, 'Session info.', 200, foundedSession);
});
