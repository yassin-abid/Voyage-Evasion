// public/js/index.js
// Home page functionality

window.addEventListener('DOMContentLoaded', () => {
    // Newsletter form handler
    const newsletterForm = document.querySelector('.newsletter form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            const submitBtn = newsletterForm.querySelector('button');
            const originalBtnText = submitBtn.textContent;
            
            // Validate email
            if (!email || !isValidEmail(email)) {
                showNotification('Veuillez entrer une adresse email valide.', 'error');
                return;
            }
            
            // Show loading state
            submitBtn.textContent = 'Inscription...';
            submitBtn.disabled = true;
            
            try {
                // Here you would normally send to your backend
                // For now, we'll simulate a successful subscription
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Show success message
                showNotification('Merci pour votre inscription! Vous recevrez nos dernières offres.', 'success');
                
                // Reset form
                newsletterForm.reset();
                
            } catch (error) {
                showNotification('Erreur lors de l\'inscription. Veuillez réessayer.', 'error');
                console.error('Newsletter subscription error:', error);
            } finally {
                // Restore button
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Featured destinations "En savoir plus" buttons
    const destinationButtons = document.querySelectorAll('.featured-destinations article button');
    destinationButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Get the destination title
            const article = e.target.closest('article');
            const title = article.querySelector('h2').textContent;
            
            // Redirect to destinations page (you can add query parameter for filtering)
            window.location.href = `/html/destinations.html?destination=${encodeURIComponent(title)}`;
        });
    });
    
    // Smooth scroll for CTA button
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', (e) => {
            // Let the default link behavior work (goes to destinations.html)
            // But we can add analytics or other tracking here if needed
        });
    }
});

// Helper function to validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Helper function to show notification
function showNotification(message, type = 'success') {
    // Create notification element
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
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    
    if (!document.querySelector('style[data-notification]')) {
        style.setAttribute('data-notification', 'true');
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}
