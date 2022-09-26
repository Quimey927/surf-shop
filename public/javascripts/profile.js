let newPasswordValue;
let confirmationValue;
const submitBtn = document.getElementById('update-profile');
const newPassword = document.getElementById('new-password');
const confirmation = document.getElementById('password-confirmation');
const validationMessage = document.getElementById('validation-message');

function validatePasswords(message, add, remove) {
  validationMessage.textContent = message;
  validationMessage.classList.add(add);
  validationMessage.classList.remove(remove);
};

function validateListener(evt) {
  evt.preventDefault()
  newPasswordValue = newPassword.value
  confirmationValue = confirmation.value
 
  if (!newPasswordValue && !confirmationValue) {
    validationMessage.textContent = ''
    submitBtn.removeAttribute('disabled')
  } else if (newPasswordValue !== confirmationValue) {
    validatePasswords('Passwords must match', 'color-red', 'color-green')
    submitBtn.setAttribute('disabled', true)
  } else {
    validatePasswords('Passwords match', 'color-green', 'color-red')
    submitBtn.removeAttribute('disabled')
  }
}
 
confirmation.addEventListener('input', validateListener)
newPassword.addEventListener('input', validateListener)
