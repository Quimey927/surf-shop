const Post = require('./models/post');
const loremIpsum = require('lorem-ipsum').loremIpsum;
const cities = require('./cities');

async function seedPosts() {
	await Post.remove({});

	for (let i = 1; i <= 600; i++) {
		const random1000 = Math.floor(Math.random() * 1000);
		const title = `Post number ${i}`;
		const description = loremIpsum();

		const postData = {
			title,
			description,
			price: 9.99,
			location: `${cities[random1000].city}, ${cities[random1000].state}`,
			geometry: {
				type: 'Point',
				coordinates: [cities[random1000].longitude, cities[random1000].latitude]
			},
			author: '632de08bae9fe3404a6be6c2'
		}

		const post = new Post(postData);
		post.properties.description = `<strong><a href="/posts/${post._id}">${title}</a></strong><p>${post.location}</p><p>${description.substring(0, 20)}...</p>`;

		await post.save();
	}
	console.log('600 new posts created');
}

module.exports = seedPosts;