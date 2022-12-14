const Post = require('../models/post');

const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapBoxToken });

const { cloudinary } = require('../cloudinary');

module.exports = {
  // Posts Index
  async postIndex(req, res, next) {
    const { dbQuery } = res.locals;
    delete res.locals.dbQuery;
    let posts = await Post.paginate(dbQuery, {
      page: req.query.page || 1,
      limit: 10,
      sort: { '_id': -1}
    });

    posts.page = Number(posts.page);
    if (!posts.docs.length && res.locals.query) {
      res.locals.error = 'No results match that query';
    }
    res.render('posts/index', { posts, mapBoxToken, title: 'Posts Index' });
  },

  // Posts New
  postNew(req, res, next) {
    res.render('posts/new');
  },

  // Posts Create
  async postCreate(req, res, next) {
    req.body.post.images = [];

    for (let file of req.files) {
      req.body.post.images.push({
        path: file.path,
        filename: file.filename
      });
    }

    let response = await geocodingClient
      .forwardGeocode({
        query: req.body.post.location,
        limit: 1
      })
      .send();

    req.body.post.geometry = response.body.features[0].geometry;
    req.body.post.author = req.user._id;

    const post = new Post(req.body.post);
		post.properties.description = `<strong><a href="/posts/${post._id}">${post.title}</a></strong><p>${post.location}</p><p>${post.description.substring(0, 20)}...</p>`;
    post.date = new Date().toDateString().split(' ').slice(1).join(' ');
    await post.save();
    req.session.success = 'Post created successfully!';
    res.redirect(`/posts/${post.id}`)
  },

  // Posts Show
  async postShow(req, res, next) {
    let post = await Post.findById(req.params.id)
      .populate({
        path: 'reviews',
        options: { sort: { '_id': -1 } },
        populate: {
          path: 'author',
          model: 'User'
        }
      })
      .populate('author');

    const floorRating = post.calculateAvgRating();
    res.render('posts/show', { post, mapBoxToken, floorRating });
  },

  // Posts Edit
  postEdit(req, res, next) {
    // The post is already found on the isAuthor middleware, and res.locals passes it to the posts/edit view
    res.render('posts/edit');
  },

  // Posts Update
  async postUpdate(req, res, next) {
    const { post } = res.locals;

    // check if there's any image for deletion
    if (req.body.deleteImages && req.body.deleteImages.length) {
      let deleteImages = req.body.deleteImages;

      for (let filename of deleteImages) {
        // delete image from cloudinary
        await cloudinary.uploader.destroy(filename);
        
        // delete image from post.images
        for (let image of post.images) {
          if (image.filename === filename) {
            let index = post.images.indexOf(image);
            post.images.splice(index, 1);
          }
        }
      }
    }

    // check if there are any new images for upload
    if (req.files) {
      for (let file of req.files) {
        // add image to post.images array
        post.images.push({
          path: file.path,
          filename: file.filename
        });
      }
    }

    // Check if the location has been modified to update the coordinates
    if (req.body.post.location !== post.location) {
      let response = await geocodingClient
        .forwardGeocode({
          query: req.body.post.location,
          limit: 1
        })
        .send();

      post.geometry = response.body.features[0].geometry;
      post.location = req.body.post.location;
    }

    // update the post with any new properties
    post.title = req.body.post.title;
    post.price = req.body.post.title;
    post.description = req.body.post.description;
    post.properties.description = `<strong><a href="/posts/${post._id}">${post.title}</a></strong><p>${post.location}</p><p>${post.description.substring(0, 20)}...</p>`;

    
    await post.save();
    res.redirect(`/posts/${post.id}`)
  },

  // Posts Destroy
  async postDestroy(req, res, next) {
    const { post } = res.locals;

    for (let image of post.images) {
      await cloudinary.uploader.destroy(image.filename);
    }

    await post.remove();
    req.session.success = 'Post deleted successfully!';
    res.redirect('/posts');
  }
}