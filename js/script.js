// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

const apiUrl = 'https://api.nasa.gov/planetary/apod';
const apiKey = 'DEMO_KEY';

// Create the image-details modal once and reuse it for every gallery item.
const modal = document.createElement('div');
modal.className = 'modal';
modal.setAttribute('aria-hidden', 'true');
modal.innerHTML = `
  <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <button class="modal-close" type="button" aria-label="Close image details">&times;</button>
    <img class="modal-image" alt="" />
    <h2 id="modal-title" class="modal-title"></h2>
    <p class="modal-date"></p>
    <p class="modal-explanation"></p>
  </div>
`;
document.body.appendChild(modal);

const modalImage = modal.querySelector('.modal-image');
const modalTitle = modal.querySelector('.modal-title');
const modalDate = modal.querySelector('.modal-date');
const modalExplanation = modal.querySelector('.modal-explanation');
const modalCloseButton = modal.querySelector('.modal-close');
let lastFocusedElement;

function openModal(item) {
  lastFocusedElement = document.activeElement;
  modalImage.src = item.hdurl || item.url;
  modalImage.alt = item.title;
  modalTitle.textContent = item.title;
  modalDate.textContent = item.date;
  modalExplanation.textContent = item.explanation;
  modal.classList.add('modal-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-active');
  modalCloseButton.focus();
}

function closeModal() {
  modal.classList.remove('modal-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-active');
  modalImage.removeAttribute('src');

  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

modalCloseButton.addEventListener('click', closeModal);

modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal.classList.contains('modal-open')) {
    closeModal();
  }
});

// Replace the gallery contents with a short status message.
function showMessage(message) {
  gallery.replaceChildren();

  const placeholder = document.createElement('div');
  placeholder.className = 'placeholder';

  const text = document.createElement('p');
  text.textContent = message;

  placeholder.appendChild(text);
  gallery.appendChild(placeholder);
}

// Build one gallery card for an APOD image.
function createGalleryItem(item) {
  const card = document.createElement('article');
  card.className = 'gallery-item';
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `View details for ${item.title}`);

  const image = document.createElement('img');
  image.src = item.url;
  image.alt = item.title;
  image.loading = 'lazy';

  const title = document.createElement('h2');
  title.textContent = item.title;

  const date = document.createElement('p');
  date.textContent = item.date;

  card.append(image, title, date);

  card.addEventListener('click', () => openModal(item));
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openModal(item);
    }
  });

  return card;
}

function displayGallery(items) {
  // Some APOD entries are videos, so only include entries with image URLs.
  const images = items.filter((item) => item.media_type === 'image' && item.url);

  if (images.length === 0) {
    showMessage('No space images were found for this date range.');
    return;
  }

  const cards = images.map(createGalleryItem);
  gallery.replaceChildren(...cards);
}

async function getSpaceImages() {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate || startDate > endDate) {
    showMessage('Please select a valid start and end date.');
    return;
  }

  showMessage('Loading space images...');
  getImagesButton.disabled = true;

  const params = new URLSearchParams({
    api_key: apiKey,
    start_date: startDate,
    end_date: endDate,
  });

  try {
    const response = await fetch(`${apiUrl}?${params}`);

    if (!response.ok) {
      throw new Error(`NASA API request failed with status ${response.status}`);
    }

    const data = await response.json();
    displayGallery(Array.isArray(data) ? data : [data]);
  } catch (error) {
    console.error(error);
    showMessage('Unable to load space images. Please try again later.');
  } finally {
    getImagesButton.disabled = false;
  }
}

getImagesButton.addEventListener('click', getSpaceImages);
