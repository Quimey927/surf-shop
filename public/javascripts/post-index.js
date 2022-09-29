const clear = document.getElementById('clear-distance');

clear.addEventListener('click', (evt) => {
  evt.preventDefault();
  document.querySelector('input[type=radio]:checked').checked = false;
});