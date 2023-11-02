import AppError from '../error/appError.js';
import catchAsync from '../utils/catchAsync.js';
// import HandleError from '../error/errorHandler.js';
export const AuthorizationCheck = (...roles) => {
  return HandleError(async (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError(
          `You Are ${req.user.role}, Not Authorized To Access ..`,
          401
        )
      );
    next();
  });
};

export const isAuthorized = catchAsync(async (req, res, next) => {
  if (req.user.role === 'ADMIN') return next();
  else if (req.params.userName == req.user.handler) {
    return next();
  } else
    return next(
      new AppError('You donot have access to perform this action', 403)
    );
});
