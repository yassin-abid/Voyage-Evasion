// Authenticated fetch helper that includes JWT
async function authFetch(url, options = {}) {
  const token = localStorage.getItem('jwt');
  if (!token) throw new Error('Not authenticated');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    // Normalize 401 -> Not authenticated so callers can redirect consistently
    if (res.status === 401) throw new Error('Not authenticated');
    const text = await res.text().catch(() => '');
    const msg = text || `HTTP error: ${res.status}`;
    throw new Error(msg);
  }
  return res.json();
}

// Heart icon SVG as a string (for injection)
const heartSvg = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
</svg>`;

// Add favorite button to an article
function addFavoriteButton(article) {
  const destinationId = article.dataset.id;
  if (!destinationId) {
    console.warn('Article missing data-id attribute:', article);
    return;
  }

  const button = document.createElement('button');
  button.className = 'fav-button';
  button.innerHTML = heartSvg;
  button.setAttribute('aria-label', 'Toggle favorite');
  button.disabled = true; // Initially disabled until fully initialized
  
  // Handle clicks
  button.addEventListener('click', async (e) => {
    e.preventDefault();
    if (button.disabled) return;
    button.disabled = true; // Prevent double-clicks
    try {
      const isActive = button.classList.contains('active');
      if (isActive) {
        await authFetch(`/api/favorites/${destinationId}`, { method: 'DELETE' });
        button.classList.remove('active');
      } else {
        await authFetch(`/api/favorites/${destinationId}`, { method: 'POST' });
        button.classList.add('active');
      }
    } catch (err) {
      if (err.message === 'Not authenticated') {
        location.href = '/html/login.html';
      } else {
        console.error('Error toggling favorite:', err);
      }
    }
    button.disabled = false;
  });

  article.insertBefore(button, article.firstChild);
  return button;
}

// Initialize favorites UI for logged-in users
export async function initializeFavorites() {
  console.log('Initializing favorites UI...');

  // First: always attach favorite buttons to rendered articles so hearts are visible
  document.querySelectorAll('article[data-id]').forEach(article => {
    const artId = article.dataset.id;
    // Avoid adding multiple buttons if already present
    if (article.querySelector('.fav-button')) return;
    // Add button and enable it. Click handler will redirect to login when not authenticated.
    const button = addFavoriteButton(article);
    if (button) button.disabled = false;
  });

  // If the user is logged in, fetch their favorites and mark active ones
  const token = localStorage.getItem('jwt');
  if (!token) {
    console.log('No JWT found — showing hearts but not fetching favorites. Click will prompt login.');
    return; // done
  }

  try {
    const favorites = await authFetch('/api/favorites');
    console.log('Loaded favorites:', favorites);
    // Guard against favorites with missing destinationId (deleted destination or stale data)
    const ids = favorites.map(f => {
      if (!f || !f.destinationId) return null;
      // destinationId may be populated (object) or just an id string
      return (typeof f.destinationId === 'object') ? (f.destinationId._id || f.destinationId) : f.destinationId;
    }).filter(Boolean);
    const favMap = new Set(ids);
    const skipped = favorites.length - ids.length;
    if (skipped > 0) console.warn(`initializeFavorites: skipped ${skipped} favorite(s) with missing destinationId`);
    console.log('Favorite IDs:', [...favMap]);

    // Mark active buttons
    document.querySelectorAll('article[data-id]').forEach(article => {
      const artId = article.dataset.id;
      const button = article.querySelector('.fav-button');
      if (!button) return;
      if (favMap.has(artId)) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  } catch (err) {
    console.error('Error loading favorites:', err);
  }
}

// Export for use in destinations.js
window.initializeFavorites = initializeFavorites;