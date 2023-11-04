import stripe from 'stripe';
import catchAsync from '../../../middlewares/utils/catchAsync.js';
import prisma from '../../../Database/prisma/prismaClient.js';
import AppError from '../../../middlewares/error/appError.js';
import Response from '../../../middlewares/utils/response.js';
import axios from 'axios';

const stripeInstance = stripe(process.env.STRIPE_API_KEY);

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
    success_url: 'http://localhost:3000/about',
    cancel_url: 'https://www.yahoo.com/?guccounter=1',
    // customer_email: user.email,
    // client_reference_id: id,
  });
  // console.log(stripeSession.url);

  if (!stripeSession)
    return next(new AppError('Payment Failed, please try again!', 500));

  res.json({ redirectTo: stripeSession.url });
});
