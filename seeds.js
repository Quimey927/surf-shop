const Post = require('./models/post');
const loremIpsum = require('lorem-ipsum').loremIpsum;

async function seedPosts() {
  await Post.remove({});

  for (let i = 1; i <= 40; i++) {
    let post = {
      title: `Hola_${i}`,
      price: 9,
      description: loremIpsum(),
      author: {
        '_id': '6329e578468614014d6f1700',
        'username': 'ian',
      },
      location: 'Dallas, Texas',
      coordinates: [-96.803914, 32.792206]
    } 
    await Post.create(post);
  }
  console.log('40 new posts created');
}

module.exports = seedPosts;