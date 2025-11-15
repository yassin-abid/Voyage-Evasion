// Admin panel JavaScript for managing destinations
const apiBase = '/api';

// Get token from localStorage
function getToken() {
  return localStorage.getItem('jwt');
}

// Check if user is admin
function checkAdminAccess() {
  const token = getToken();
  if (!token) {
    console.log('No token found, redirecting to login');
    window.location.href = '/html/login.html';
    return false;
  }

  // Decode JWT to check if user is admin
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Token payload:', payload);
    if (!payload.isAdmin) {
      showMessage('Access denied. Admin privileges required.', true);
      setTimeout(() => window.location.href = '/html/index.html', 2000);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Token decode error:', err);
    window.location.href = '/html/login.html';
    return false;
  }
}

// Show message
function showMessage(text, isError = false) {
  const msgArea = document.getElementById('msgArea');
  msgArea.innerHTML = `<div class="msg ${isError ? 'error' : 'success'}">${text}</div>`;
  setTimeout(() => msgArea.innerHTML = '', 5000);
}

// Fetch destinations
async function fetchDestinations() {
  try {
    console.log('Fetching destinations from:', `${apiBase}/destinations`);
    const response = await fetch(`${apiBase}/destinations`);
    console.log('Response status:', response.status);
    if (!response.ok) throw new Error('Failed to fetch destinations');
    
    const destinations = await response.json();
    console.log('Destinations loaded:', destinations.length);
    renderDestinations(destinations);
  } catch (err) {
    console.error('Error fetching destinations:', err);
    showMessage('Failed to load destinations: ' + err.message, true);
  }
}

// Render destinations table
function renderDestinations(destinations) {
  const tbody = document.getElementById('destinationsTableBody');
  
  if (destinations.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No destinations found. Add your first destination above.</td></tr>';
    return;
  }

  tbody.innerHTML = destinations.map(dest => `
    <tr>
      <td><img src="${dest.image || '/img/placeholder.jpg'}" alt="${dest.name}" onerror="this.src='/img/placeholder.jpg'"></td>
      <td><strong>${dest.name || 'N/A'}</strong></td>
      <td>${dest.country || 'N/A'}</td>
      <td><span style="text-transform: capitalize;">${dest.category || 'N/A'}</span></td>
      <td>€${(dest.price || 0).toFixed(2)}</td>
      <td>⭐ ${(dest.rating || 0).toFixed(1)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-edit" onclick="editDestination('${dest._id}')">Edit</button>
          <button class="btn-delete" onclick="deleteDestination('${dest._id}', '${dest.name}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Add or update destination
async function submitDestination(e) {
  e.preventDefault();
  
  const id = document.getElementById('destinationId').value;
  const destination = {
    name: document.getElementById('name').value.trim(),
    country: document.getElementById('country').value.trim(),
    category: document.getElementById('category').value,
    price: parseFloat(document.getElementById('price').value),
    rating: parseFloat(document.getElementById('rating').value),
    image: document.getElementById('image').value.trim(),
    description: document.getElementById('description').value.trim()
  };

  try {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${apiBase}/destinations/${id}` : `${apiBase}/destinations`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(destination)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Operation failed');
    }

    showMessage(id ? 'Destination updated successfully!' : 'Destination added successfully!');
    resetForm();
    fetchDestinations();
  } catch (err) {
    console.error('Error submitting destination:', err);
    showMessage(err.message, true);
  }
}

// Edit destination
window.editDestination = async function(id) {
  try {
    const response = await fetch(`${apiBase}/destinations/${id}`);
    if (!response.ok) throw new Error('Failed to fetch destination');
    
    const dest = await response.json();
    
    // Populate form
    document.getElementById('destinationId').value = dest._id;
    document.getElementById('name').value = dest.name;
    document.getElementById('country').value = dest.country;
    document.getElementById('category').value = dest.category;
    document.getElementById('price').value = dest.price;
    document.getElementById('rating').value = dest.rating;
    document.getElementById('image').value = dest.image;
    document.getElementById('description').value = dest.description;
    
    // Update UI
    document.getElementById('formTitle').textContent = 'Edit Destination';
    document.getElementById('submitBtnText').textContent = 'Update Destination';
    document.getElementById('cancelBtn').style.display = 'inline-block';
    
    // Scroll to form
    document.getElementById('destinationForm').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    console.error('Error loading destination:', err);
    showMessage('Failed to load destination for editing', true);
  }
};

// Delete destination
window.deleteDestination = async function(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
    return;
  }

  try {
    const response = await fetch(`${apiBase}/destinations/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Delete failed');
    }

    showMessage('Destination deleted successfully!');
    fetchDestinations();
  } catch (err) {
    console.error('Error deleting destination:', err);
    showMessage(err.message, true);
  }
};

// Reset form
function resetForm() {
  document.getElementById('destinationForm').reset();
  document.getElementById('destinationId').value = '';
  document.getElementById('formTitle').textContent = 'Add New Destination';
  document.getElementById('submitBtnText').textContent = 'Add Destination';
  document.getElementById('cancelBtn').style.display = 'none';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin page initializing...');
  const isAdmin = checkAdminAccess();
  if (isAdmin) {
    console.log('Admin access confirmed, fetching destinations');
    fetchDestinations();
  } else {
    console.log('Not admin or no token');
  }
  
  // Event listeners
  document.getElementById('destinationForm').addEventListener('submit', submitDestination);
  document.getElementById('cancelBtn').addEventListener('click', resetForm);
});
