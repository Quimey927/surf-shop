const Review = require('../models/review');
const User = require('../models/user');
const Post = require('../models/post');
const { cloudinary } = require('../cloudinary');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapBoxToken });

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string 
}

module.exports = {
  asyncErrorHandler: (fn) => 
    (req, res, next) => {
      Promise
        .resolve(fn(req, res, next))
        .catch(next);
    },

  isReviewAuthor: async (req, res, next) => {
    let review = await Review.findById(req.params.review_id);
    if (review.author.equals(req.user._id)) {
      return next();
    }
    req.session.error = 'You have not permission to do that';
    return res.redirect('/');
  },

  isLoggedIn: async (req, res, next) => {
    if (req.isAuthenticated()) return next();
    req.session.error = 'You need to be logged in to do that!';
    req.session.redirectTo = req.originalUrl;
    res.redirect('/login');
  },

  isAuthor: async (req, res, next) => {
    const post = await Post.findById(req.params.id);
    if (post.author.equals(req.user._id)) {
      res.locals.post = post;
      return next();
    }
    req.session.error = 'Access denied';
    res.redirect('back');
  },

  isValidPassword: async function(req, res, next) {
    const { user } = await User.authenticate()(req.user.username, req.body.currentPassword);
    if (user) {
      res.locals.user = user;
      next();
    } else {
      this.deleteProfileImage(req);
      req.session.error = 'Incorrect current password!';
      return res.redirect('/profile');
    }
  },

  changePassword: async function(req, res, next) {
    const { newPassword, passwordConfirmation } = req.body;

    if (newPassword && !passwordConfirmation) {
      this.deleteProfileImage(req);
      req.session.error = 'Missing password confirmation!';
      return res.redirect('/profile');
    } else if (newPassword && passwordConfirmation) {
      const { user } = res.locals;
      if (newPassword === passwordConfirmation) {
        await user.setPassword(newPassword);
        next();
      } else {
        this.deleteProfileImage(req);
        req.session.error = 'New passwords must match!';
        return res.redirect('/profile');
      }
    } else {
      next();
    }
  },

  deleteProfileImage: async (req) => {
    if (req.file) await cloudinary.uploader.destroy(filename);
  },

  async searchAndFilterPosts(req, res, next) {
    const queryKeys = Object.keys(req.query);

    if (queryKeys.length) {
      const dbQueries = [];
      let { search, price, avgRating, location, distance  } = req.query;

      if (search) {
        search = new RegExp(escapeRegExp(search), 'gi');
        dbQueries.push({ $or: [
          { title: search },
          { description: search },
          { location: search }
        ]});
      }

      if (location) {
        let coordinates;
        try {
          if (typeof JSON.parse(location) === 'number') {
            throw new Error;
          }
          location = JSON.parse(location);
          coordinates = location;
        } catch(err) {
          const response = await geocodingClient
            .forwardGeocode({
              query: location,
              limit: 1
            })
            .send();
          coordinates = response.body.features[0].geometry.coordinates;
        }

        let maxDistance = distance || 25;
        // we need to convert the distance to meters, one mile is approximately 1609.34 meters
        maxDistance *= 1609.34;
        
        dbQueries.push({
          geometry: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates
              },
              $maxDistance: maxDistance
            }
          }
        });
      }

      if (price) {
        if (price.min) dbQueries.push({ price: { $gte: price.min } });
        if (price.max) dbQueries.push({ price: { $lte: price.max } });
      }

      if (avgRating) {
        dbQueries.push({ avgRating: { $in: avgRating } });
      }
  
      // pass database query to next middleware in route's middleware chain which is the postIndex method from /controllers/postsController.js
      res.locals.dbQuery = dbQueries.length ? { $and: dbQueries } : {};
    }
    // pass req.query to the view as a local variable to be used in the searchAndFilter.ejs partial. This allows us to maintain the state of the searchAndFilter form
    res.locals.query = req.query;
  
    // build the paginateUrl for paginatePosts partial
    // first remove 'page' string value from queryKeys array, if it exists
    queryKeys.splice(queryKeys.indexOf('page'), 1);
    const delimiter = queryKeys.length ? '&' : '?';
    res.locals.paginateUrl = req.originalUrl.replace(/(\?|\&)page=\d+/g, '') + `${delimiter}page=`;
    next();
  }
}