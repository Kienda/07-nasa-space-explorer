// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');
const spaceFactText = document.getElementById('space-fact-title');

const spaceFacts = [
  'A day on Venus is longer than a year on Venus.',
  'Sunlight takes about eight minutes and twenty seconds to reach Earth.',
  'More than one million Earths could fit inside the Sun by volume.',
  'Neutron stars can spin hundreds of times every second.',
  'The footprints left by Apollo astronauts could remain on the Moon for millions of years.',
  'Olympus Mons on Mars is the largest known volcano in our solar system.',
  'Saturn is less dense than water, although there is no ocean large enough to float it in.',
  'The International Space Station circles Earth roughly once every ninety minutes.',
  'Jupiter has the shortest day of any planet in our solar system—about ten hours.',
  'The Milky Way and Andromeda galaxies are expected to merge billions of years from now.',
];

function showRandomSpaceFact() {
  const randomIndex = Math.floor(Math.random() * spaceFacts.length);
  spaceFactText.textContent = spaceFacts[randomIndex];
}

showRandomSpaceFact();

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

const apiUrl = 'https://api.nasa.gov/planetary/apod';

// js/config.js defines window.NASA_API_KEY. It is generated from .env for local
// work and from the NASA_API_KEY repository secret during the Pages build, so
// the key itself is never committed. Without it we fall back to NASA's shared
// demo key, which is rate limited to a handful of requests per hour.
const apiKey = window.NASA_API_KEY || 'DEMO_KEY';
const usingDemoKey = apiKey === 'DEMO_KEY';

if (usingDemoKey) {
  console.warn('js/config.js is missing or did not set window.NASA_API_KEY. Falling back to DEMO_KEY.');
}

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

// Build a gallery card for an APOD video with a direct link to the source.
function createVideoGalleryItem(item) {
  const card = document.createElement('article');
  card.className = 'gallery-item video-item';

  const videoLink = document.createElement('a');
  videoLink.className = 'video-link';
  videoLink.href = item.url;
  videoLink.target = '_blank';
  videoLink.rel = 'noopener noreferrer';
  videoLink.setAttribute('aria-label', `Watch ${item.title} (opens in a new tab)`);

  if (item.thumbnail_url) {
    const thumbnail = document.createElement('img');
    thumbnail.src = item.thumbnail_url;
    thumbnail.alt = '';
    thumbnail.loading = 'lazy';
    videoLink.appendChild(thumbnail);
  } else {
    const videoPlaceholder = document.createElement('div');
    videoPlaceholder.className = 'video-placeholder';
    videoPlaceholder.textContent = 'NASA APOD Video';
    videoLink.appendChild(videoPlaceholder);
  }

  const playLabel = document.createElement('span');
  playLabel.className = 'play-label';
  playLabel.innerHTML = '<span aria-hidden="true">▶</span> Watch video';
  videoLink.appendChild(playLabel);

  const title = document.createElement('h2');
  title.textContent = item.title;

  const date = document.createElement('p');
  date.textContent = item.date;

  card.append(videoLink, title, date);
  return card;
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
  const galleryItems = items.filter((item) => item.url).map((item) => {
    if (item.media_type === 'video') {
      return createVideoGalleryItem(item);
    }

    return createGalleryItem(item);
  });

  if (galleryItems.length === 0) {
    showMessage('No APOD entries were found for this date range.');
    return;
  }

  gallery.replaceChildren(...galleryItems);
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
    thumbs: 'true',
  });

  try {
    const response = await fetch(`${apiUrl}?${params}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const error = new Error(
        errorData?.error?.message || `NASA API request failed with status ${response.status}`
      );
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    displayGallery(Array.isArray(data) ? data : [data]);
  } catch (error) {
    console.error(error);

    if (error.status === 429 && usingDemoKey) {
      showMessage("No NASA API key was loaded, so this page used NASA's shared demo key and hit its request limit. Add js/config.js with your own key and reload.");
    } else if (error.status === 429) {
      showMessage('Your NASA API key has hit its hourly request limit. Please try again in a little while.');
    } else {
      showMessage(`Unable to load space images. ${error.message}`);
    }
  } finally {
    getImagesButton.disabled = false;
  }
}

getImagesButton.addEventListener('click', getSpaceImages);
