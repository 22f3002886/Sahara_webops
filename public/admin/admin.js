const $ = (selector) => document.querySelector(selector);
let csrf;
let offset = 0;
let nextOffset = null;
let query = '';
let requestNumber = 0;
let lastTrigger;
const dialog = $('#message-dialog');

async function api(path, options = {}) {
  const response = await fetch(`/api/admin${path}`, {
    credentials: 'same-origin',
    cache: 'no-store',
    signal: AbortSignal.timeout(20000),
    ...options,
  });
  const result = await response.json();
  if (!response.ok) {
    const error = Error(result.error || 'Unable to complete your request.');
    error.status = response.status;
    throw error;
  }
  return result;
}
function showLogin(message = '') {
  requestNumber++;
  csrf = null;
  if (dialog.open) dialog.close();
  $('#submissions').replaceChildren();
  $('#inbox').hidden = true;
  $('#login-panel').hidden = false;
  $('#status').textContent = '';
  $('#login-error').textContent = message;
}
function date(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}
function element(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}
function openMessage(row, trigger) {
  lastTrigger = trigger;
  $('#message-title').textContent = row.name;
  const meta = $('#message-meta');
  meta.replaceChildren();
  for (const [label, value] of [
    ['Email', row.email],
    ['Identity', row.identity || 'Not specified'],
    ['Topic', row.topic],
    ['Received', date(row.created_at)],
    ['Reference', row.id],
  ]) {
    const dd = element('dd', '', value);
    if (label === 'Email') {
      const link = element('a', '', value);
      link.href = `mailto:${encodeURIComponent(value)}`;
      dd.replaceChildren(link);
    }
    meta.append(element('dt', '', label), dd);
  }
  $('#message-body').textContent = row.message;
  dialog.showModal();
}
async function load() {
  const current = ++requestNumber;
  $('#submissions').setAttribute('aria-busy', 'true');
  $('#inbox-status').textContent = 'Loading submissions…';
  $('#previous').disabled = true;
  $('#next').disabled = true;
  try {
    const result = await api(`/inquiries?offset=${offset}&q=${encodeURIComponent(query)}`);
    if (current !== requestNumber) return;
    const list = $('#submissions');
    list.replaceChildren();
    for (const row of result.items) {
      const article = element('article', 'submission');
      const heading = element('div');
      heading.append(element('h2', '', row.name), element('p', 'meta', row.email));
      const time = element('time', '', date(row.created_at));
      time.dateTime = row.created_at;
      const button = element('button', 'secondary', 'Read message');
      button.type = 'button';
      button.setAttribute('aria-label', `Read message from ${row.name}`);
      button.addEventListener('click', () => openMessage(row, button));
      article.append(
        heading,
        time,
        element('span', 'topic', row.topic),
        element(
          'p',
          'preview',
          `${row.message.slice(0, 180)}${row.message.length > 180 ? '…' : ''}`,
        ),
        button,
      );
      list.append(article);
    }
    if (!result.items.length)
      list.append(
        element(
          'p',
          'empty',
          query
            ? 'No submissions match your search.'
            : 'No messages yet. New contact submissions will appear here.',
        ),
      );
    $('#total').textContent = result.total;
    $('#inbox-status').textContent = result.items.length
      ? `Showing ${offset + 1}–${offset + result.items.length} of ${result.total}${query ? ' matching submissions' : ''}. Times are shown in your local timezone.`
      : '';
    $('#storage-note').textContent =
      result.storage === 'PostgreSQL'
        ? 'Connected to PostgreSQL. Use Refresh to check for new messages.'
        : 'Local SQLite storage. On Render Free, these records can be lost when the service sleeps or redeploys. Connect PostgreSQL for persistent storage.';
    nextOffset = result.nextOffset;
    $('#previous').disabled = offset === 0;
    $('#next').disabled = nextOffset === null;
    $('#page-number').textContent = `Page ${Math.floor(offset / 20) + 1}`;
  } catch (error) {
    if (current !== requestNumber) return;
    if (error.status === 401) showLogin(error.message);
    else
      $('#inbox-status').textContent =
        error.name === 'TimeoutError'
          ? 'The server is taking a little longer. Please try Refresh.'
          : error.message;
  } finally {
    if (current === requestNumber) $('#submissions').setAttribute('aria-busy', 'false');
  }
}
async function signedIn(result) {
  csrf = result.csrf;
  offset = 0;
  query = '';
  $('#search').value = '';
  $('#password').value = '';
  $('#status').textContent = '';
  $('#login-error').textContent = '';
  $('#login-panel').hidden = true;
  $('#inbox').hidden = false;
  $('#inbox-title').focus();
  await load();
}
$('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = $('#login-button');
  if (button.disabled) return;
  button.disabled = true;
  button.textContent = 'Signing in…';
  $('#login-error').textContent = '';
  try {
    const result = await api('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: $('#username').value.trim(),
        password: $('#password').value,
      }),
    });
    await signedIn(result);
  } catch (error) {
    $('#login-error').textContent =
      error.name === 'TimeoutError'
        ? 'The server is waking up. Please try again in a moment.'
        : error.message;
  } finally {
    button.disabled = false;
    button.textContent = 'Sign in';
  }
});
$('#logout').addEventListener('click', async () => {
  const button = $('#logout');
  button.disabled = true;
  try {
    await api('/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      body: '{}',
    });
    showLogin();
    $('#password').focus();
  } catch (error) {
    if (error.status === 401) showLogin(error.message);
    else $('#inbox-status').textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
$('#search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  query = $('#search').value.trim();
  offset = 0;
  load();
});
$('#refresh').addEventListener('click', () => {
  offset = 0;
  load();
});
$('#previous').addEventListener('click', () => {
  offset = Math.max(0, offset - 20);
  load();
});
$('#next').addEventListener('click', () => {
  if (nextOffset !== null) {
    offset = nextOffset;
    load();
  }
});
$('#close-message').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => lastTrigger?.focus());
api('/session')
  .then(signedIn)
  .catch((error) => showLogin(error.status === 401 ? '' : error.message));
