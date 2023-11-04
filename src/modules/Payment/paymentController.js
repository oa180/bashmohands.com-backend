import stripe from 'stripe';
import catchAsync from '../../../middlewares/utils/catchAsync.js';
import prisma from '../../../Database/prisma/prismaClient.js';
import AppError from '../../../middlewares/error/appError.js';
import Response from '../../../middlewares/utils/response.js';
import axios from 'axios';

const stripeInstance = stripe(process.env.STRIPE_API_KEY);

export const dataStorage = {};

function generateUniqueIdentifier() {
  return Math.random().toString(36).substr(2, 9);
}

export const sessionCheckout = catchAsync(async (req, res, next) => {
  let { instructorHandler, clientHandler, date, notes } = req.body;
  console.log(
    '🚀 ~ file: paymentController.js:18 ~ sessionCheckout ~  { instructorHandler, clientHandler, date, notes }:',
    { instructorHandler, clientHandler, date, notes }
  );
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
    token,
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
    // success_url: `bashmohands.onrender.com/api/pay/success?uniqueIdentifier=${uniqueIdentifier}`,
    success_url: `http://localhost:5000/api/pay/success?uniqueIdentifier=${uniqueIdentifier}`,
    cancel_url: 'https://www.yahoo.com/?guccounter=1',
    // customer_email: user.email,
    // client_reference_id: id,
  });
  // console.log(stripeSession.url);

  if (!stripeSession)
    return next(new AppError('Payment Failed, please try again!', 500));

  res.json({ redirectTo: stripeSession.url });
});

export const handleSuccessPayment = catchAsync(async (req, res, next) => {
  try {
    // const sessionId = req.query.session_id;
    const uniqueIdentifier = req.query.uniqueIdentifier;

    const { instructorHandler, clientHandler, date, notes, token } =
      dataStorage[uniqueIdentifier];

    // res.json({
    //   message: 'Payment successful',
    //   instructorHandler,
    //   clientHandler,
    //   date,
    //   notes,
    //   token,
    // });

    const bookSessionUrl = 'http://localhost:5000/api/session/book';
    // const bookSessionUrl = 'bashmohands.onrender.com/api/session/book';

    const response = axios.post(
      bookSessionUrl,
      {
        instructorHandler,
        clientHandler,
        date,
        topics: ['Js'],
        notes,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(response.data);

    Response(res, 'Session Booked Successfuuly.', 200);
  } catch (error) {
    console.log('Error in /success route:', error);
    res.status(500).json({ error });
  }
});
