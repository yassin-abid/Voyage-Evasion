// public/js/destinations.js
// Handles fetching and rendering destinations

import { initializeFavorites } from './favorites.js';

let allDestinations = []; // Store all destinations
let currentCategory = null; // Track current category filter

async function fetchDestinations() {
  const res = await fetch('/api/destinations');
  if (!res.ok) throw new Error('Failed to fetch destinations');
  return res.json();
}

function createDestinationArticle(destination) {
  const article = document.createElement('article');
  article.dataset.id = destination._id;
  article.dataset.category = destination.category;

  // Create and append elements
  const h2 = document.createElement('h2');
  h2.textContent = destination.name;

  const img = document.createElement('img');
  img.src = destination.image;
  img.alt = destination.name;

  const p = document.createElement('p');
  p.textContent = destination.description;

  const categoryDiv = document.createElement('div');
  categoryDiv.className = 'destination-category';
  categoryDiv.textContent = destination.category;

  const button = document.createElement('button');
  button.textContent = 'En savoir plus';
  button.addEventListener('click', () => openModal(destination._id));

  // Append all elements
  article.appendChild(h2);
  article.appendChild(img);
  article.appendChild(p);
  article.appendChild(categoryDiv);
  article.appendChild(button);

  return article;
}

function filterDestinations(category) {
  currentCategory = category;
  const destinations = category 
    ? allDestinations.filter(dest => dest.category === category)
    : allDestinations;

  const mainContent = document.querySelector('.main-content');
  mainContent.innerHTML = ''; // Clear existing content

  // Create and append each destination article
  destinations.forEach(dest => {
    const article = createDestinationArticle(dest);
    mainContent.appendChild(article);
  });

  // Update active category in sidebar
  document.querySelectorAll('.sidebar a').forEach(link => {
    link.classList.toggle('active', link.textContent === category);
  });

    // Reinitialize favorites (always attach hearts; favorites will be fetched if logged in)
    initializeFavorites();
}

async function renderDestinations() {
  try {
    allDestinations = await fetchDestinations();
    filterDestinations(currentCategory);
  } catch (err) {
    console.error('Error rendering destinations:', err);
  }
}

// Initialize category filter links
function initializeCategoryFilters() {
  const sidebar = document.querySelector('.sidebar');
  
  // Add "All" category at the top
  const allLink = document.createElement('li');
  allLink.innerHTML = '<a href="#" class="active">All</a>';
  sidebar.querySelector('ul').prepend(allLink);

  // Add click handlers to all category links
  sidebar.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const category = link.textContent === 'All' ? null : link.textContent;
      filterDestinations(category);
    });
  });
}

// Modal functions
async function openModal(destinationId) {
  try {
    const response = await fetch(`/api/destinations/${destinationId}`);
    if (!response.ok) throw new Error('Failed to fetch destination details');
    
    const destination = await response.json();
    
    // Populate modal with destination details
    document.getElementById('modal-image').src = destination.image;
    document.getElementById('modal-image').alt = destination.name;
    document.getElementById('modal-name').textContent = destination.name;
    document.getElementById('modal-country').textContent = `📍 ${destination.country}`;
    document.getElementById('modal-description').textContent = destination.description;
    document.getElementById('modal-price').textContent = `€${(destination.price || 0).toFixed(2)}`;
    document.getElementById('modal-rating').textContent = `⭐ ${(destination.rating || 0).toFixed(1)}/5`;
    document.getElementById('modal-category').textContent = destination.category;
    
    // Show modal
    const modal = document.getElementById('destinationModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  } catch (err) {
    console.error('Error opening modal:', err);
    alert('Failed to load destination details. Please try again.');
  }
}

function closeModal() {
  const modal = document.getElementById('destinationModal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto'; // Restore scrolling
}

// Initialize modal close handlers
function initializeModal() {
  const modal = document.getElementById('destinationModal');
  const closeBtn = document.querySelector('.modal-close');
  
  // Close on X button click
  closeBtn.addEventListener('click', closeModal);
  
  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') {
      closeModal();
    }
  });
}

// Load destinations and initialize filters on page load
window.addEventListener('DOMContentLoaded', async () => {
  await renderDestinations();
  initializeCategoryFilters();
  initializeModal();
  // Initialize favorites if user is logged in
 
    // Initialize favorites UI (always attach hearts; will fetch favorites if logged in)
    initializeFavorites();
});