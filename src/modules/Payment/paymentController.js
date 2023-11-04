import stripe from 'stripe';
import catchAsync from '../../../middlewares/utils/catchAsync.js';
import prisma from '../../../Database/prisma/prismaClient.js';
import AppError from '../../../middlewares/error/appError.js';
import Response from '../../../middlewares/utils/response.js';
import axios from 'axios';

const stripeInstance = stripe(process.env.STRIPE_API_KEY);
const dataStorage = {};

// Generate a unique identifier function (a simple UUID generator)
function generateUniqueIdentifier() {
  return Math.random().toString(36).substr(2, 9);
}
export const sessionCheckout = catchAsync(async (req, res, next) => {
  let { instructorHandler, clientHandler, date, notes } = req.body;
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else {
    throw new AppError('Token Is not found, please provide one!', 400);
  }

  const uniqueIdentifier = generateUniqueIdentifier();
  dataStorage[uniqueIdentifier] = {
    instructorHandler,
    clientHandler,
    date,
    notes,
  };

  let price = await prisma.user.findUnique({
    where: { handler: instructorHandler },
    select: { hourlyRate: true },
  });
  console.log(price);

  let stripeSession = await stripeInstance.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: 12 * 1000,
          product_data: {
            name: `Session with ${instructorHandler}`,
            // sessionId: id,
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `http://localhost:5000/success?session_id=${stripeSession.id}`,
    cancel_url: 'https://www.yahoo.com/?guccounter=1',
    // customer_email: user.email,
    // client_reference_id: id,
    client_reference_id: uniqueIdentifier,
  });
  // console.log(stripeSession.url);

  if (!stripeSession)
    return next(new AppError('Payment Failed, please try again!', 500));

  res.json({ redirectTo: stripeSession.url });
});
