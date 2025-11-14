// public/js/contact.js
// Contact form handler

window.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.querySelector('.contact-form form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const subject = document.getElementById('subject').value.trim();
            const message = document.getElementById('message').value.trim();
            
            // Create message element if it doesn't exist
            let messageEl = document.querySelector('.contact-message');
            if (!messageEl) {
                messageEl = document.createElement('div');
                messageEl.className = 'contact-message';
                contactForm.insertAdjacentElement('beforebegin', messageEl);
            }
            
            // Show loading message
            messageEl.textContent = 'Envoi en cours...';
            messageEl.className = 'contact-message';
            
            try {
                // Here you would normally send to your backend
                // For now, we'll simulate a successful submission
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Show success message
                messageEl.textContent = 'Message envoyé avec succès! Nous vous répondrons bientôt.';
                messageEl.className = 'contact-message success';
                
                // Reset form
                contactForm.reset();
                
                // Remove message after 5 seconds
                setTimeout(() => {
                    messageEl.remove();
                }, 5000);
                
            } catch (error) {
                // Show error message
                messageEl.textContent = 'Erreur lors de l\'envoi du message. Veuillez réessayer.';
                messageEl.className = 'contact-message error';
                
                console.error('Contact form error:', error);
            }
        });
    }
});
