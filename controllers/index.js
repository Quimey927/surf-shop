const User = require('../models/user');
const Post = require('../models/post');
const passport = require('passport');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const util = require('util');
const { cloudinary } = require('../cloudinary');
const { deleteProfileImage } = require('../middleware');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = {
  // GET /
  async landingPage(req, res, next) {
    const posts = await Post.find({}).sort('-_id').exec();
    const recentPosts = posts.slice(0, 3);
    return res.render('index', { posts, recentPosts, mapBoxToken, title: 'Surf Shop - Home' });
  },

  // GET /register
  getRegister(req, res, next) {
    res.render('register', { title: 'Register', username: '', email: '' });
  },

  // POST /register
  async postRegister(req, res, next) {
    try {
      if (req.file) {
        const { path, filename } = req.file;
        req.body.image = {
          path,
          filename
        };
      }
      const { email } = req.body;
      const emailAlreadyExists = await User.findOne({ 'email': email });
      if (emailAlreadyExists) {
        throw new Error('A user with the given email is already registered');
      }
      const user = await User.register(new User(req.body), req.body.password);
      req.login(user, (err) => {
        if (err) return next(err);
        req.session.success = `Welcome to Surf Shop, ${user.username}!`;
        res.redirect('/');
      });
    } catch(err) {
      deleteProfileImage(req);
      const { username, email } = req.body;
      let error = err.message;
      res.render('register', { title: 'Register', username, email, error });
    }
  },

  // GET /login
  getLogin(req, res, next) {
    if (req.isAuthenticated()) return res.redirect('/');
    if (req.query.returnTo) req.session.redirectTo = req.headers.referer;
    res.render('login', { title: 'Login' });
  },

  // POST /login
  async postLogin(req, res, next) {
    const redirectUrl = req.session.redirectTo || '/';
    delete req.session.redirectTo;
    const { username, password } = req.body;
    const { user, error } = await User.authenticate()(username, password);
    if (!user && error) return next(error);
    req.login(user, function(err) {
      if (err) return next(err);
      req.session.success = `Welcome back, ${username}!`;
      res.redirect(redirectUrl);
    });
  },

  // GET /logout
  getLogout(req, res, next) {
    req.logout(function (err) {
      if (err) {
          return next(err);
      }
      res.redirect('/');
    });
  },

  // GET /profile
  async getProfile(req, res, next) {
    const posts = await Post.find().where('author').equals(req.user._id).limit(10).exec();
    res.render('profile', { posts });
  },

  // PUT /profile
  async updateProfile(req, res, next) {
    const { username, email } = req.body;
    const { user } = res.locals;

    if (username) user.username = username;
    if (email) user.email = email;
    if (req.file) {
      if (user.image.filename) await cloudinary.uploader.destroy(user.image.filename);
      const { path, filename } = req.file;
      user.image = {
        path,
        filename
      };
    }

    await user.save();

    const login = util.promisify(req.login.bind(req));
    await login(user);
    req.session.success = 'Profile successfully updated!';
    res.redirect('/profile');
  },

  // GET /forgot-password
  getForgotPw(req, res, next) {
    res.render('users/forgot');
  },

  // PUT /forgot-password
  async putForgotPw(req, res, next) {
    const token = await crypto.randomBytes(20).toString('hex');

    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      req.session.error = 'No account with that email address exists';
      return res.redirect('/forgot-password');
    }

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + ( 1000 * 60 * 60 ); // 1 hour
    await user.save();

    const msg = {
      to: user.email,
      from: 'Surf Shop Admin <quimeymata@gmail.com>',
      subject: 'Surf Shop - Forgot Password / Reset',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.
        Please click on the following link, or copy and paste it into your browser to complete the process:
        http://${req.headers.host}/reset/${token}
        If you did not request this, please ignore this email and your password will remain unchanged.`.replace(/        /g, '')
    };

    await sgMail.send(msg);

    req.session.success = `An e-mail has been sent to ${user.email} whit further instructions.`;
    res.redirect('/forgot-password');
  },

  // GET /reset/:token
  async getReset(req, res, next) {
    const { token } = req.params;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.session.error = 'Password reset token is invalid or has expired';
      return res.redirect('/forgot-password');
    }

    res.render('users/reset', { token });
  },

  // PUT /reset/:token
  async putReset(req, res, next) {
    const { token } = req.params;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      req.session.error = 'Password reset token is invalid or has expired';
      return res.redirect(`/reset/${token}`);
    }

    if (req.body.password === req.body.confirm) {
      await user.setPassword(req.body.password);
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      const login = util.promisify(req.login.bind(req));
      await login(user);
    } else {
      req.session.error = 'Passwords do not match';
      return res.redirect(`/reset/${token}`);
    }

    const msg = {
      to: user.email,
      from: 'Surf Shop Admin <quimeymata@gmail.com>',
      subject: 'Surf Shop - Password Changed',
      text: `Hello,
        This email is to confirm that the password for your account has just been changed.
        If you did not make this change, please hit reply and notify us at once.`.replace(/        /g, '')
    };

    await sgMail.send(msg);

    req.session.success = 'Password successfully updated!';
    res.redirect('/');
  }
}
