const Post = require('../models/post');
const cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: 'dejhmgbbc',
  api_key: '857412884752558',
  api_secret: process.env.CLOUDINARY_SECRET
});

module.exports = {
  // Posts Index
  async postIndex(req, res, next) {
    let posts = await Post.find({});
    res.render('posts/index', { posts });
  },

  // Posts New
  postNew(req, res, next) {
    res.render('posts/new');
  },

  // Posts Create
  async postCreate(req, res, next) {
    req.body.post.images = [];

    for (let file of req.files) {
      let image = await cloudinary.v2.uploader.upload(file.path);
      req.body.post.images.push({
        url: image.secure_url,
        public_id: image.public_id
      });
    }

    let post = await Post.create(req.body.post);
    res.redirect(`/posts/${post.id}`)
  },

  // Posts Show
  async postShow(req, res, next) {
    let post = await Post.findById(req.params.id);
    res.render('posts/show', { post });
  },

  // Posts Edit
  async postEdit(req, res, next) {
    let post = await Post.findById(req.params.id);
    res.render('posts/edit', { post });
  },

  // Posts Update
  async postUpdate(req, res, next) {
    let post = await Post.findById(req.params.id);

    // check if there's any image for deletion
    if (req.body.deleteImages && req.body.deleteImages.length) {
      let deleteImages = req.body.deleteImages;

      for (let public_id of deleteImages) {
        // delete image from cloudinary
        await cloudinary.v2.uploader.destroy(public_id);
        
        // delete image from post.images
        for (let image of post.images) {
          if (image.public_id === public_id) {
            let index = post.images.indexOf(image);
            post.images.splice(index, 1);
          }
        }
      }
    }

    // check if there are any new images for upload
    if (req.files) {
      for (let file of req.files) {
        // upload image to cloudinary
        let image = await cloudinary.v2.uploader.upload(file.path);

        // add image to post.images array
        post.images.push({
          url: image.secure_url,
          public_id: image.public_id
        });
      }
    }

    // update the post with any new properties
    post.title = req.body.post.title;
    post.price = req.body.post.title;
    post.description = req.body.post.description;
    post.location = req.body.post.location;

    await post.save();
    res.redirect(`/posts/${post.id}`)
  },

  // Posts Destroy
  async postDestroy(req, res, next) {
    let post = await Post.findById(req.params.id);

    for (let image of post.images) {
      await cloudinary.v2.uploader.destroy(image.public_id);
    }

    await post.remove();
    res.redirect('/posts');
  }
}