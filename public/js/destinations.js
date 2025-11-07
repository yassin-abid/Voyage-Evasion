// public/js/destinations.js
// Handles fetching and rendering destinations

async function fetchDestinations() {
  const res = await fetch('/api/destinations');
  if (!res.ok) throw new Error('Failed to fetch destinations');
  return res.json();
}

function createDestinationArticle(destination) {
  return `
    <article data-id="${destination._id}">
      <h2>${destination.name}</h2>
      <img src="${destination.image}" alt="${destination.name}">
      <p>${destination.description}</p>
      <button>En savoir plus</button>
    </article>
  `;
}

async function renderDestinations() {
  try {
    const destinations = await fetchDestinations();
    const mainContent = document.querySelector('.main-content');
    mainContent.innerHTML = destinations
      .map(dest => createDestinationArticle(dest))
      .join('');
      
    // If user is logged in, initialize favorites
    if (localStorage.getItem('jwt')) {
      initializeFavorites();
    }
  } catch (err) {
    console.error('Error rendering destinations:', err);
  }
}

// Load destinations on page load
window.addEventListener('DOMContentLoaded', renderDestinations);