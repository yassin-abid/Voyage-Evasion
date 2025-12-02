// Profile page functionality
const API_BASE = '/api';

// Check authentication and redirect if not logged in
function checkAuth() {
    const token = localStorage.getItem('jwt');
    if (!token) {
        window.location.href = '/html/login.html';
        return null;
    }
    return token;
}

// Get authorization headers
function getAuthHeaders() {
    const token = localStorage.getItem('jwt');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Load user profile info
function loadProfileInfo() {
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('email') || 'user@example.com';
    
    document.getElementById('profile-username').textContent = username || 'User';
    document.getElementById('profile-email').textContent = email;
}

// Fetch and display favorites
async function loadFavorites() {
    const container = document.getElementById('favorites-container');
    
    try {
        const response = await fetch(`${API_BASE}/favorites`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch favorites');
        }

        const favorites = await response.json();
        
        if (favorites.length === 0) {
            container.innerHTML = `
                <div class="empty-message">
                    <p>Vous n'avez pas encore de destinations favorites.</p>
                    <p>Explorez nos <a href="/html/destinations.html" style="color: #4CAF50; font-weight: bold;">destinations</a> et ajoutez vos préférées!</p>
                </div>
            `;
            return;
        }

        // Fetch full destination details for each favorite
        const destinationPromises = favorites.map(async (fav) => {
            if (!fav.destinationId || !fav.destinationId._id) {
                return null;
            }
            
            const destResponse = await fetch(`${API_BASE}/destinations/${fav.destinationId._id}`);
            if (destResponse.ok) {
                return await destResponse.json();
            }
            return null;
        });

        const destinations = await Promise.all(destinationPromises);
        const validDestinations = destinations.filter(dest => dest !== null);

        if (validDestinations.length === 0) {
            container.innerHTML = `
                <div class="empty-message">
                    <p>Aucune destination favorite trouvée.</p>
                </div>
            `;
            return;
        }

        // Render favorite cards
        container.innerHTML = validDestinations.map(dest => `
            <div class="favorite-card" data-destination-id="${dest._id}">
                <img src="${dest.image || '/img/placeholder.jpg'}" alt="${dest.name}">
                <div class="favorite-card-content">
                    <h3>${dest.name}</h3>
                    <p>${dest.description ? dest.description.substring(0, 100) + '...' : 'Découvrez cette destination magnifique.'}</p>
                    <div class="favorite-card-actions">
                        <button class="btn-view" onclick="viewDestination('${dest._id}')">
                            Voir Plus
                        </button>
                        <button class="btn-remove" onclick="removeFavorite('${dest._id}')">
                            ❌ Retirer
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading favorites:', error);
        container.innerHTML = `
            <div class="empty-message">
                <p style="color: #f44336;">Erreur lors du chargement de vos favoris.</p>
                <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Réessayer
                </button>
            </div>
        `;
    }
}

// View destination details
window.viewDestination = function(destinationId) {
    window.location.href = `/html/destinations.html?id=${destinationId}`;
};

// Remove favorite
window.removeFavorite = async function(destinationId) {
    const card = document.querySelector(`[data-destination-id="${destinationId}"]`);
    const removeBtn = card.querySelector('.btn-remove');
    
    // Disable button during request
    removeBtn.disabled = true;
    removeBtn.textContent = 'Retrait...';
    
    try {
        const response = await fetch(`${API_BASE}/favorites/${destinationId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to remove favorite');
        }

        // Show success notification
        showNotification('Destination retirée de vos favoris', 'success');
        
        // Animate card removal
        card.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            card.remove();
            
            // Check if there are any favorites left
            const remainingCards = document.querySelectorAll('.favorite-card');
            if (remainingCards.length === 0) {
                document.getElementById('favorites-container').innerHTML = `
                    <div class="empty-message">
                        <p>Vous n'avez pas encore de destinations favorites.</p>
                        <p>Explorez nos <a href="/html/destinations.html" style="color: #4CAF50; font-weight: bold;">destinations</a> et ajoutez vos préférées!</p>
                    </div>
                `;
            }
        }, 300);

    } catch (error) {
        console.error('Error removing favorite:', error);
        showNotification('Erreur lors du retrait de la destination', 'error');
        
        // Re-enable button
        removeBtn.disabled = false;
        removeBtn.textContent = '❌ Retirer';
    }
};

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background-color: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;

    // Add animation styles if not already present
    if (!document.querySelector('style[data-notification]')) {
        const style = document.createElement('style');
        style.setAttribute('data-notification', 'true');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
            @keyframes fadeOut {
                from { opacity: 1; transform: scale(1); }
                to { opacity: 0; transform: scale(0.8); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Fetch and display saved trip plans
async function loadSavedPlans() {
    const container = document.getElementById('saved-plans-container');
    
    try {
        const response = await fetch(`${API_BASE}/trip-plans`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch trip plans');
        }

        const plans = await response.json();
        
        if (plans.length === 0) {
            container.innerHTML = `
                <div class="empty-message">
                    <p>Vous n'avez pas encore d'itinéraires sauvegardés.</p>
                    <p>Créez votre premier voyage avec notre <a href="/html/trip-planner.html" style="color: #4CAF50; font-weight: bold;">Planificateur IA</a>!</p>
                </div>
            `;
            return;
        }

        // Render plan cards
        container.innerHTML = plans.map(plan => `
            <div class="plan-card" data-plan-id="${plan._id}">
                <div class="plan-card-header">
                    <h3>${plan.destination}</h3>
                    <span class="plan-date">${new Date(plan.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="plan-details">
                    <p><strong>Durée:</strong> ${plan.duration} jours</p>
                    <p><strong>Budget:</strong> ${plan.budget}€</p>
                    <p><strong>Voyageurs:</strong> ${plan.travelers}</p>
                </div>
                <div class="plan-card-actions">
                    <button class="btn-view-plan" onclick="viewPlan('${plan._id}')">
                        👁️ Voir
                    </button>
                    <button class="btn-delete-plan" onclick="deletePlan('${plan._id}')">
                        🗑️ Supprimer
                    </button>
                </div>
                <!-- Hidden content for modal view -->
                <div id="plan-content-${plan._id}" style="display:none;">
                    ${plan.generatedPlan}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading plans:', error);
        container.innerHTML = `
            <div class="empty-message">
                <p style="color: #f44336;">Erreur lors du chargement de vos itinéraires.</p>
            </div>
        `;
    }
}

// View Plan Details (Simple Modal)
window.viewPlan = function(planId) {
    const content = document.getElementById(`plan-content-${planId}`).innerHTML;
    const planCard = document.querySelector(`[data-plan-id="${planId}"]`);
    const title = planCard.querySelector('h3').textContent;

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>Itinéraire pour ${title}</h2>
            <div class="modal-body markdown-body">
                ${formatMarkdown(content)}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal logic
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => modal.remove();
    window.onclick = (event) => {
        if (event.target == modal) modal.remove();
    }
};

function formatMarkdown(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

// Delete Plan
window.deletePlan = async function(planId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet itinéraire ?')) return;

    try {
        const response = await fetch(`${API_BASE}/trip-plans/${planId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to delete plan');

        // Remove from UI
        const card = document.querySelector(`[data-plan-id="${planId}"]`);
        card.remove();
        
        // Check empty state
        const remaining = document.querySelectorAll('.plan-card');
        if (remaining.length === 0) {
            loadSavedPlans(); // Reload to show empty message
        }
        
        showNotification('Itinéraire supprimé', 'success');

    } catch (error) {
        console.error('Error deleting plan:', error);
        showNotification('Erreur lors de la suppression', 'error');
    }
};

// Initialize page
window.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!checkAuth()) return;
    
    // Load profile info
    loadProfileInfo();
    
    // Load favorites
    loadFavorites();

    // Load saved plans
    loadSavedPlans();
});
