const Post = require('./models/post');
const loremIpsum = require('lorem-ipsum').loremIpsum;
const cities = require('./cities');

async function seedPosts() {
	await Post.deleteMany({});

	for (let i = 1; i <= 600; i++) {
		const random1000 = Math.floor(Math.random() * 1000);
		const random5 = Math.floor(Math.random() * 6);
		const title = `Post number ${i}`;
		const description = loremIpsum();

		const postData = {
			title,
			description,
			location: `${cities[random1000].city}, ${cities[random1000].state}`,
			geometry: {
				type: 'Point',
				coordinates: [cities[random1000].longitude, cities[random1000].latitude]
			},
			price: random1000,
			avgRating: random5,
			author: '63320068c9bf3c5325a03d2d',
			images: [
				{
					path: 'https://res.cloudinary.com/devsprout/image/upload/v1561315599/surf-shop/surfboard.jpg'
				}
			]
		}

		const post = new Post(postData);
		post.properties.description = `<strong><a href="/posts/${post._id}">${title}</a></strong><p>${post.location}</p><p>${description.substring(0, 20)}...</p>`;

		await post.save();
	}
	console.log('600 new posts created');
}

module.exports = seedPosts;