'use strict';
const menuButton = document.querySelector('#menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  navigation.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
});
navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navigation.classList.contains('open')) {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.header')) closeMenu();
});
matchMedia('(min-width: 801px)').addEventListener('change', closeMenu);
const galleryItems = [...document.querySelectorAll('.gallery-thumb')];
const lightbox = document.querySelector('#lightbox');
let photoIndex = 0;
let photoTrigger;
function showGalleryPhoto(index) {
  photoIndex = (index + galleryItems.length) % galleryItems.length;
  const item = galleryItems[photoIndex];
  const source = item.querySelector('img');
  const preview = document.querySelector('#gallery-preview');
  preview.src = source.src;
  preview.alt = item.dataset.alt;
  document.querySelector('#gallery-photo-title').textContent = item.dataset.title;
  document.querySelector('#gallery-photo-caption').textContent = item.dataset.caption;
  document.querySelector('#gallery-position').textContent =
    `${photoIndex + 1} of ${galleryItems.length}`;
  galleryItems.forEach((thumb, i) => thumb.setAttribute('aria-pressed', String(i === photoIndex)));
}
function showPhoto(index) {
  showGalleryPhoto(index);
  const item = galleryItems[photoIndex];
  const preview = document.querySelector('#lightbox-image');
  preview.src = item.querySelector('img').src;
  preview.alt = item.dataset.alt;
  document.querySelector('#lightbox-caption').textContent = item.dataset.caption;
  document.querySelector('#lightbox-count').textContent =
    `${photoIndex + 1} / ${galleryItems.length}`;
}
galleryItems.forEach((item, index) =>
  item.addEventListener('click', () => showGalleryPhoto(index)),
);
document
  .querySelector('#gallery-previous')
  .addEventListener('click', () => showGalleryPhoto(photoIndex - 1));
document
  .querySelector('#gallery-next')
  .addEventListener('click', () => showGalleryPhoto(photoIndex + 1));
document.querySelector('.gallery-thumbnails').addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? galleryItems.length - 1
        : photoIndex + (event.key === 'ArrowRight' ? 1 : -1);
  showGalleryPhoto(next);
  galleryItems[photoIndex].focus();
});
document.querySelector('#gallery-enlarge').addEventListener('click', (event) => {
  photoTrigger = event.currentTarget;
  showPhoto(photoIndex);
  lightbox.showModal();
  document.querySelector('#lightbox-close').focus();
});
document.querySelector('#lightbox-close').addEventListener('click', () => lightbox.close());
document.querySelector('#lightbox-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
document.querySelector('#lightbox-next').addEventListener('click', () => showPhoto(photoIndex + 1));
lightbox.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    showPhoto(photoIndex + (event.key === 'ArrowRight' ? 1 : -1));
  }
  if (event.key !== 'Tab') return;
  const controls = [...lightbox.querySelectorAll('button')];
  const first = controls[0],
    last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
lightbox.addEventListener('click', (event) => {
  if (event.target !== lightbox) return;
  const r = lightbox.getBoundingClientRect();
  if (
    event.clientX < r.left ||
    event.clientX > r.right ||
    event.clientY < r.top ||
    event.clientY > r.bottom
  )
    lightbox.close();
});
lightbox.addEventListener('close', () => photoTrigger?.focus());
const form = document.querySelector('#contact-form');
const status = document.querySelector('#form-status');
const submitButton = document.querySelector('#submit-button');
let formToken;
let requestId = crypto.randomUUID();
let pending = false;
async function loadToken() {
  const response = await fetch('/api/form-token', { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw Error('Unable to prepare the form. Please try again shortly.');
  const data = await response.json();
  formToken = data.token;
}
loadToken().catch(() => {});
function announce(message, state) {
  status.textContent = message;
  status.dataset.state = state;
}
function showErrors(errors) {
  for (const field of ['name', 'lastName', 'identity', 'email', 'topic', 'message']) {
    const input = form.elements[field];
    document.querySelector(`#${field}-error`).textContent = errors[field] || '';
    input.setAttribute('aria-invalid', String(Boolean(errors[field])));
  }
  const first = Object.keys(errors)[0];
  if (first) form.elements[first].focus();
}
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (pending) return;
  const errors = {};
  for (const field of ['name', 'lastName', 'identity', 'email', 'topic', 'message']) {
    const input = form.elements[field];
    if (!input.validity.valid)
      errors[field] = input.validity.valueMissing
        ? 'Please complete this field.'
        : input.validity.typeMismatch
          ? 'Enter a valid email address.'
          : 'Please check this field.';
  }
  const name = form.elements.name.value.trim(),
    message = form.elements.message.value.trim();
  if (name.length < 2) errors.name = 'Use at least 2 characters for your name.';
  if (message.length < 10) errors.message = 'Use at least 10 characters for your message.';
  showErrors(errors);
  if (Object.keys(errors).length) {
    announce('Please check the highlighted fields.', 'error');
    return;
  }
  pending = true;
  submitButton.disabled = true;
  submitButton.textContent = 'Sending…';
  form.setAttribute('aria-busy', 'true');
  announce('Saving your inquiry…', 'pending');
  try {
    if (!formToken) {
      await loadToken();
      await new Promise((resolve) => setTimeout(resolve, 1600));
    }
    const data = Object.fromEntries(new FormData(form));
    data.id = requestId;
    data.token = formToken;
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(12000),
    });
    const result = await response.json();
    if (!response.ok) {
      if (result.errors) showErrors(result.errors);
      throw Error(result.error || 'We could not save your message. Please try again.');
    }
    if (result.ok !== true) throw Error('We could not confirm your message. Please try again.');
    form.reset();
    showErrors({});
    requestId = crypto.randomUUID();
    announce('Thank you. Your message has been received successfully.', 'success');
    formToken = undefined;
    loadToken().catch(() => {});
  } catch (error) {
    announce(
      error.name === 'TypeError' || error.name === 'TimeoutError'
        ? 'Connection interrupted. Your message is still here. Please try again.'
        : error.message,
      'error',
    );
  } finally {
    pending = false;
    submitButton.disabled = false;
    submitButton.textContent = 'Send message';
    form.setAttribute('aria-busy', 'false');
  }
});

// Keep the navigation connected to the section currently being read.
const sectionLinks = [...navigation.querySelectorAll('a[href^="#"]')];
const readingSections = sectionLinks.map((link) => document.querySelector(link.hash));
let navigationFrame = 0;
function updateReadingPosition() {
  const readingLine = document.querySelector('.header').getBoundingClientRect().bottom + 100;
  let current = readingSections[0];
  for (const section of readingSections) {
    if (section.getBoundingClientRect().top <= readingLine) current = section;
  }
  for (const link of sectionLinks) {
    if (link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  navigationFrame = 0;
}
function scheduleReadingPosition() {
  if (!navigationFrame) navigationFrame = requestAnimationFrame(updateReadingPosition);
}
addEventListener('scroll', scheduleReadingPosition, { passive: true });
addEventListener('resize', scheduleReadingPosition);
addEventListener('load', scheduleReadingPosition);
scheduleReadingPosition();

const eventFilters = [...document.querySelectorAll('[data-event-filter]')];
eventFilters.forEach((button) =>
  button.addEventListener('click', () => {
    const category = button.dataset.eventFilter;
    let count = 0;
    for (const card of document.querySelectorAll('.event-card')) {
      const visible = category === 'all' || card.dataset.category === category;
      card.hidden = !visible;
      if (visible) count++;
    }
    for (const filter of eventFilters)
      filter.setAttribute('aria-pressed', String(filter === button));
    document.querySelector('#event-count').textContent =
      category === 'all'
        ? 'Showing all 6 past events'
        : `Showing ${count} past ${category.toLowerCase()} events`;
  }),
);
