const User = require('../models/user');
const Post = require('../models/post');
const passport = require('passport');
const mapBoxToken = process.env.MAPBOX_TOKEN;

module.exports = {
  // GET /
  async landingPage(req, res, next) {
    let posts = await Post.find({});
    return res.render('index', { posts, mapBoxToken, title: 'Surf Shop - Home' });
  },

  // GET /register
  getRegister(req, res, next) {
    res.render('register', { title: 'Register', username: '', email: '' });
  },

  // POST /register
  async postRegister(req, res, next) {
    try {
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
  }
}
