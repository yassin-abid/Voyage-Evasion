const API_BASE = '/api';
let currentPlanData = null;
let conversationHistory = [];

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('jwt');
    if (!token) {
        window.location.href = '/html/login.html';
        return null;
    }
    return token;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    const form = document.getElementById('trip-form');
    const btnNewSearch = document.getElementById('btn-new-search');
    const btnSavePlan = document.getElementById('btn-save-plan');
    const chatSend = document.getElementById('chat-send');
    const chatInput = document.getElementById('chat-input');

    form.addEventListener('submit', handleFormSubmit);
    btnNewSearch.addEventListener('click', resetPlanner);
    btnSavePlan.addEventListener('click', savePlan);
    chatSend.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
});

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const btnGenerate = document.querySelector('.btn-generate');
    const originalBtnText = btnGenerate.textContent;
    btnGenerate.disabled = true;
    btnGenerate.textContent = 'Génération de l\'itinéraire...';

    const formData = {
        departure: document.getElementById('departure').value,
        destination: document.getElementById('destination').value,
        duration: document.getElementById('duration').value,
        travelers: document.getElementById('travelers').value,
        startDate: document.getElementById('startDate').value,
        budget: document.getElementById('budget').value,
        interests: document.getElementById('interests').value
    };

    // Construct the prompt
    const prompt = `
    Je veux planifier un voyage avec les détails suivants :
    - Ville de départ : ${formData.departure}
    - Destination : ${formData.destination}
    - Durée : ${formData.duration} jours
    - Voyageurs : ${formData.travelers}
    - Date de début : ${formData.startDate || 'Non spécifiée'}
    - Budget Total : ${formData.budget}€
    - Intérêts : ${formData.interests}

    Crée un itinéraire détaillé jour par jour.
    IMPORTANT : Si le budget de ${formData.budget}€ semble trop bas pour ${formData.duration} jours à ${formData.destination} (incluant le transport depuis ${formData.departure}) pour ${formData.travelers} personnes, fournis quand même un plan pour un budget minimum réaliste, mais commence par expliquer clairement pourquoi le budget initial est insuffisant et quel serait le budget minimum recommandé.
    
    Structure la réponse avec :
    1. Résumé du voyage (incluant options de transport depuis ${formData.departure})
    2. Itinéraire Jour par Jour (Matin, Après-midi, Soir)
    3. Estimation des coûts (Transport, Logement, Activités, Nourriture)
    4. Conseils pratiques
    `;

    try {
        const token = localStorage.getItem('jwt');
        const response = await fetch(`${API_BASE}/chatbot/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message: prompt,
                conversationHistory: [] // Start fresh
            })
        });

        if (!response.ok) throw new Error('Failed to generate plan');

        const data = await response.json();
        
        // Store data for saving later
        currentPlanData = {
            ...formData,
            generatedPlan: data.response
        };

        // Initialize conversation history with the context
        conversationHistory = [
            { role: 'user', text: prompt },
            { role: 'model', text: data.response }
        ];

        displayPlan(data.response);
        showResults();

    } catch (error) {
        console.error('Error:', error);
        alert('Une erreur est survenue lors de la génération du plan. Veuillez réessayer.');
    } finally {
        btnGenerate.disabled = false;
        btnGenerate.textContent = originalBtnText;
    }
}

function displayPlan(markdownText) {
    const contentDiv = document.getElementById('plan-content');
    // Simple markdown formatting
    let html = markdownText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    
    contentDiv.innerHTML = html;
}

function showResults() {
    document.getElementById('form-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'block';
}

function resetPlanner() {
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('form-section').style.display = 'block';
    document.getElementById('trip-form').reset();
    document.getElementById('chat-messages').innerHTML = '';
    currentPlanData = null;
    conversationHistory = [];
}

async function savePlan() {
    if (!currentPlanData) return;

    const btnSave = document.getElementById('btn-save-plan');
    const originalText = btnSave.textContent;
    btnSave.disabled = true;
    btnSave.textContent = 'Sauvegarde...';

    try {
        const token = localStorage.getItem('jwt');
        const response = await fetch(`${API_BASE}/trip-plans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(currentPlanData)
        });

        if (!response.ok) throw new Error('Failed to save plan');

        alert('Itinéraire sauvegardé avec succès ! Retrouvez-le dans votre profil.');
        btnSave.textContent = '✅ Sauvegardé';

    } catch (error) {
        console.error('Error:', error);
        alert('Erreur lors de la sauvegarde.');
        btnSave.textContent = originalText;
        btnSave.disabled = false;
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    // Add user message to UI
    addChatMessage(message, 'user');
    input.value = '';

    try {
        const token = localStorage.getItem('jwt');
        
        // Append instruction to get a full plan update
        const enhancedMessage = `${message}\n\n(IMPORTANT: Si cette demande implique une modification de l'itinéraire, veuillez régénérer l'itinéraire COMPLET mis à jour afin que je puisse le sauvegarder en entier. Ne donnez pas seulement les changements, mais le plan complet révisé.)`;

        const response = await fetch(`${API_BASE}/chatbot/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message: enhancedMessage,
                conversationHistory: conversationHistory.map(msg => ({
                    role: msg.role,
                    parts: [{ text: msg.text }]
                }))
            })
        });

        if (!response.ok) throw new Error('Failed to get response');

        const data = await response.json();
        
        // Update history
        conversationHistory.push({ role: 'user', text: message });
        conversationHistory.push({ role: 'model', text: data.response });

        // Add bot response to UI
        addChatMessage(data.response, 'bot');

        // Update the current plan data with the NEW full response
        // We assume the bot followed instructions and provided a full plan.
        // Even if it didn't, saving the latest response is better than just appending.
        currentPlanData.generatedPlan = data.response;
        
        // Also update the main display to show the new plan
        displayPlan(data.response);

    } catch (error) {
        console.error('Chat error:', error);
        addChatMessage('Désolé, une erreur est survenue.', 'bot');
    }
}

function addChatMessage(text, sender) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `chat-message ${sender}`;
    
    let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    div.innerHTML = `
        <div class="message-content">${html}</div>
    `;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}
