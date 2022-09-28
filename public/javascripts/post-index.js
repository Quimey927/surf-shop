const clear = document.getElementById('clear-distance');

clear.addEventListener('click', (evt) => {
  evt.preventDefault();
  document.getElementById('location').value = '';
  document.querySelector('input[type=radio]:checked').checked = false;
});