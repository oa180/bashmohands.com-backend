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
  const { instructorHandler, clientHandler, notes, date, topics } = req.body;

  //if not sent the 2 users .. if not sent topics .. if the both not exist in database
  if (!instructorHandler || !clientHandler)
    return next(new AppError('Instructor or client are messing', 400));

  if (!topics) return next(new AppError('Topics are messing', 400));

  const clientAndInstructorFound = await prisma.user.findMany({
    where: { OR: [{ handler: instructorHandler }, { handler: clientHandler }] },
  });

  if (clientAndInstructorFound.length !== 2)
    return next(new AppError('Wrong instructor or client handler!', 404));

  //this is the first session or sceond .. for payment?
  const lastSession = await prisma.session.findMany({
    where: { AND: [{ clientHandler }, { instructorHandler }] },
  });
  console.log(
    '🚀 ~ file: paymentController.js:39 ~ sessionCheckout ~ lastSession:',
    lastSession
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

  if (lastSession.length >= 1) {
    //payment
    //check existence of pending sessions
    let deliveredSession = lastSession.filter(ele => ele.status == 'pending');
    console.log(
      '🚀 ~ file: paymentController.js:57 ~ sessionCheckout ~ deliveredSession:',
      deliveredSession
    );
    if (deliveredSession.length != 0)
      return next(
        new AppError(
          'Cannot book another session with this instrctor, already running session!',
          400
        )
      );

    // checkout before creation
    const stripeSession = await paySession({
      instructorHandler,
      clientHandler,
      notes,
      date,
      topics,
      token,
    });

    const sessionResponse = {};
    sessionResponse.redirectTo = stripeSession.url;
    Response(res, 'Session Booked succccessfully.', 201, sessionResponse);
  } else {
    //free session
    console.log('Hager');

    const sessionResponse = await bookSessionRequest(
      instructorHandler,
      clientHandler,
      date,
      notes,
      token
    );
    console.log(
      '🚀 ~ file: paymentController.js:82 ~ sessionCheckout ~ sessionResponse:',
      sessionResponse
    );

    sessionResponse.redirectTo = `http://localhost:3000/${clientHandler}/account/sessions`;
    Response(res, 'Session Booked succccessfully.', 201, sessionResponse);

    // Response(res, 'Session Booked Successfully.', 200, sessionResponse);

    // return bookSessionRequest(
    //   instructorHandler,
    //   clientHandler,
    //   date,
    //   notes,
    //   token
    // );
  }
});

const bookSessionRequest = async (
  instructorHandler,
  clientHandler,
  date,
  notes,
  token
) => {
  const bookSessionUrl = 'http://localhost:5000/api/session/book';

  const response = await axios.post(
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

  return response.data.data;
};

const paySession = async userData => {
  try {
    console.log('cvbnm,./');

    const { instructorHandler, clientHandler, notes, date, topics, token } =
      userData;
    console.log(instructorHandler, clientHandler, date, notes, token);

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

    return stripeSession;
  } catch (error) {
    console.log(error);
  }
};

export const handleSuccessPayment = catchAsync(async (req, res, next) => {
  try {
    // const sessionId = req.query.session_id;
    const uniqueIdentifier = req.query.uniqueIdentifier;
    console.log(
      '🚀 ~ file: paymentController.js:200 ~ handleSuccessPayment ~ uniqueIdentifier:',
      uniqueIdentifier
    );

    const { instructorHandler, clientHandler, date, notes, token } =
      dataStorage[uniqueIdentifier];
    const sessionResponse = await bookSessionRequest(
      instructorHandler,
      clientHandler,
      date,
      notes,
      token
    );
    // console.log(
    //   '🚀 ~ file: paymentController.js:82 ~ sessionCheckout ~ sessionResponse:',
    //   sessionResponse
    // );
    sessionResponse.redirectTo = `http://localhost:3000/${clientHandler}/account/sessions`;

    Response(res, 'Session Booked succccessfully.', 201, sessionResponse);
  } catch (error) {
    console.log('Error in /success route:', error);
    res.status(500).json({ error });
  }
});
