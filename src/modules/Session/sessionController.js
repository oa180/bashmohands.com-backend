import prisma from '../../../Database/prisma/prismaClient.js';
import AppError from '../../../middlewares/error/appError.js';
import catchAsync from '../../../middlewares/utils/catchAsync.js';
import Response from '../../../middlewares/utils/response.js';

export const bookSession = catchAsync(async (req, res, next) => {
  const { instructorHandler, clientHandler, notes, date, topics } = req.body;

  if (!instructorHandler || !clientHandler)
    return next(new AppError('Instructor or client are messing', 400));
  console.log(req.body);

  if (!topics) return next(new AppError('Topics are messing', 400));
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

  const runningSessionAvailable = await prisma.session.findFirst({
    where: {
      clientHandler,
      instructorHandler,
      status: { not: 'deliverd' },
    },
  });
  if (runningSessionAvailable)
    return next(
      new AppError(
        'Cannot book another session with this instrctor, already running session!',
        400
      )
    );

  let foundedTopics = await prisma.topic.findMany({
    where: { name: { in: topics } },
    select: { id: true },
  });

  if (foundedTopics.length !== topics.length)
    return next(new AppError('Wrong topic name!', 404));

  const topicIds = foundedTopics.map(topic => topic.id);

  console.log(topicIds);

  const session = await prisma.session.create({
    data: {
      instructorHandler,
      clientHandler,
      notes,
      date,
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

export const approveSession = catchAsync(async (req, res, next) => {
  const sessionId = req.params.sid;
  const foundedSessoin = await prisma.session.updateMany({
    where: {
      OR: [
        { instructorHandler: req.user.handler },
        { clientHandler: req.user.handler },
      ],
      AND: { id: sessionId },
    },
    data: {
      status: 'running',
    },
  });

  if (!foundedSessoin) return next(new AppError('Session Not Found!', 404));

  Response(
    res,
    'Instructor Approved Session Successfully.',
    200,
    foundedSessoin
  );
});

export const cancelSession = catchAsync(async (req, res, next) => {
  const sessionId = req.params.sid;

  const foundedSessoin = await prisma.session.update({
    where: {
      id: sessionId,
    },
    data: {
      status: 'canceled',
    },
  });

  if (!foundedSessoin) return next(new AppError('Session Not Found!', 404));

  Response(res, 'Session Cancelled Successfully.', 200, foundedSessoin);
});

export const resceduleSession = catchAsync(async (req, res, next) => {
  const sessionId = req.params.sid;

  const { date } = req.body;
  console.log(
    '🚀 ~ file: sessionController.js:167 ~ resceduleSession ~ date:',
    date
  );

  const foundedSessoin = await prisma.session.update({
    where: {
      id: sessionId,
    },
    data: {
      date,
    },
  });

  if (!foundedSessoin) return next(new AppError('Session Not Found!', 404));

  Response(res, 'Session Rescheduled Successfully.', 200, foundedSessoin);
});

export const getAllSessions = catchAsync(async (req, res, next) => {
  const sessions = await prisma.session.findMany({});
  Response(res, 'All Sessions', 200, sessions);
});

export const penddingSessions = catchAsync(async (req, res, next) => {
  const userHandler = req.params.userName;
  console.log(
    '🚀 ~ file: sessionController.js:196 ~ penddingSessions ~ userHandler:',
    userHandler
  );

  const foundedPenddingSessions = await prisma.session.findMany({
    where: {
      AND: [{ instructorHandler: userHandler }, { status: 'pending' }],
    },
    select: {
      Client: true,
      clientHandler: true,
      date: true,
      id: true,
      instructorHandler: true,
      notes: true,
      status: true,
      // topics: true,
    },
  });

  Response(res, 'Instructor pendding sessions.', 200, foundedPenddingSessions);
});
