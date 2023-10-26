import prisma from '../../../Database/prisma/prismaClient.js';
import AppError from '../../../middlewares/error/appError.js';
import catchAsync from '../../../middlewares/utils/catchAsync.js';
import Response from '../../../middlewares/utils/response.js';

export const bookSession = catchAsync(async (req, res, next) => {
  const { instructorHandler, clientHandler, notes, date, topics } = req.body;

  if (!instructorHandler || !clientHandler)
    return next(new AppError('Instructor or client ar messing', 400));
  let foundedTopics = await prisma.topic.findMany({
    where: { name: { in: topics } },
    select: { id: true },
  });

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
