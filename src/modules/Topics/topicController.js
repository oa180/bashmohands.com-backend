import prisma from '../../../Database/prisma/prismaClient.js';

import catchAsync from '../../../middlewares/utils/catchAsync.js';

import Response from '../../../middlewares/utils/response.js';

export const getAllTopics = catchAsync(async (req, res, next) => {
  const allTopics = await prisma.topic.findMany({});

  Response(res, 'All Topics', 200, allTopics);
});

export const createNewTopic = catchAsync(async (req, res, next) => {
  const { name } = req.body;

  const newTopic = await prisma.topic.create({
    data: { name },
  });

  Response(res, 'Topic created.', 201, newTopic);
});

export const getTopicByName = async topicName => {
  try {
    const topic = await prisma.topic.findUnique({ where: { name: topicName } });

    if (!topic) return null;

    return topic;
  } catch (error) {
    throw error;
  }
};
