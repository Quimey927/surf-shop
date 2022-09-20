mapboxgl.accessToken = 'pk.eyJ1IjoicXVpbWV5OTI3IiwiYSI6ImNsN2RpMW8zejE5am0zcXFmdzNydHJodWcifQ.w5wvIHSWIXfQvbLhB2a3jA';
    
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v10',
  center: post.coordinates,
  zoom: 5
});

// add markers to map
// create a HTML element for our post/location marker
const el = document.createElement('div');
el.className = 'marker';

// make a marker for our location and add to the map
new mapboxgl.Marker(el)
.setLngLat(post.coordinates)
.setPopup(
  new mapboxgl.Popup({ offset: 25 }) // add popups
    .setHTML(
      `<h3>${post.title}</h3><p>${post.location}</p>`
    )
)
.addTo(map);