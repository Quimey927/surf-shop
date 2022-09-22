  const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v10',
  center: post.geometry.coordinates,
  zoom: 5
});

// add markers to map
// create a HTML element for our post/location marker
const el = document.createElement('div');
el.className = 'marker';

// make a marker for our location and add to the map
new mapboxgl.Marker(el)
  .setLngLat(post.geometry.coordinates)
  .setPopup(
    new mapboxgl.Popup({ offset: 25 }) // add popups
      .setHTML(
        `<h3>${post.title}</h3><p>${post.location}</p>`
      )
  )
  .addTo(map);

// Toggle edit review form
const toggleEditForm = document.querySelectorAll('.toggle-edit-form');
const editReviewForm = document.querySelectorAll('.edit-review-form');

toggleEditForm.forEach((button, i) => button.addEventListener('click', function() {
  toggleEditForm[i].innerText = toggleEditForm[i].innerText === 'Edit' ? 'Cancel' : 'Edit';
  editReviewForm[i].classList.toggle('edit-review-form');
}));

// Add click listener for clearing of rating from edit/new form
const clearRating = document.querySelectorAll('.clear-rating');
const inputNoRate = document.querySelectorAll('.input-no-rate');
clearRating.forEach((button, i) => button.addEventListener('click', function() {
  inputNoRate[i].click();
}))