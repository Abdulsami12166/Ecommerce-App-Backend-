const UserActivity = require('../../models/UserActivity');

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return sendError(res, 400, 'Email and OTP code are required');
    }

    const user = await User.findOne({ email })
      .select('+otpCode +otpExpiresAt');

    if (!user) {
      return sendError(
        res,
        404,
        'Account not found. Please register first.',
      );
    }

    if (user.otpCode !== otpCode) {
      return sendError(res, 401, 'Invalid OTP code');
    }

    if (
      user.otpExpiresAt &&
      user.otpExpiresAt < new Date()
    ) {
      return sendError(
        res,
        401,
        'OTP has expired. Please request a new code.',
      );
    }

    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    user.isVerified = true;
    user.lastLoginAt = new Date();

    await user.save();

    // SAVE USER ACTIVITY
    await UserActivity.create({
      user: user._id,
      action: 'login',
      details: `${user.name} logged in successfully`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // REALTIME EVENT
    const emitAdminEvent = req.app.get('emitAdminEvent');

    if (emitAdminEvent) {
      emitAdminEvent('user-login', {
        userId: user._id,
        name: user.name,
        email: user.email,
        loginTime: new Date(),
      });
    }

    // CREATE JWT TOKEN
    const token = createUserToken(user);

    logger.info('User OTP verified', {
      userId: user._id,
      email: user.email,
    });

    return sendSuccess(
      res,
      200,
      'OTP verified successfully',
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar || '',
          isVerified: true,
        },
      },
    );
  } catch (error) {
    next(error);
  }
};