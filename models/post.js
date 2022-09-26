const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review');
const mongoosePaginate = require('mongoose-paginate');

const PostSchema = new Schema({
  title: String,
  price: String,
  description: String,
  images: [ { path: String, filename: String } ],
  location: String,
  geometry: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    } 
  },
  properties: {
    description: String,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Review'
    }
  ],
  avgRating: {
    type: Number,
    default: 0
  }
});

PostSchema.plugin(mongoosePaginate);

PostSchema.pre('remove', async function() {
  await Review.remove({
    _id: {
      $in: this.reviews
    }
  });
});

PostSchema.methods.calculateAvgRating = function() {
  if (this.reviews.length) {
    let ratingsTotal = 0;
    this.reviews.forEach(review => {
      ratingsTotal += review.rating;
    });
    this.avgRating = Math.round((ratingsTotal / this.reviews.length) * 10) / 10;
  } else {
    this.avgRating = 0;
  }
  this.save();
  const floorRating = Math.floor(this.avgRating);
  return floorRating;
}

module.exports = mongoose.model('Post', PostSchema);