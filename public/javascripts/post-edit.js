let postEditForm = document.getElementById('postEditForm');

postEditForm.addEventListener('submit', function(event) {
  // find length of uploaded images
  let imageUploads = document.getElementById('imageUpload').files.length;

  // find total number of existing images
  let existingImgs = document.querySelectorAll('.imageDeleteCheckbox').length;

  // find total number of potential deletions
  let imgDeletions = document.querySelectorAll('.imageDeleteCheckbox:checked').length;

  // figure out if the form can be submitted or not
  let newTotal = existingImgs - imgDeletions + imageUploads
  if (newTotal > 4) {
    event.preventDefault();
    alert(`You need to remove at least ${newTotal - 4} (more) image${newTotal - 4 === 1 ? '' : 's'}!`);
  }
});