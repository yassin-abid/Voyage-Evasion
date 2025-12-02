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
    - Destination : ${formData.destination}
    - Durée : ${formData.duration} jours
    - Voyageurs : ${formData.travelers}
    - Date de début : ${formData.startDate || 'Non spécifiée'}
    - Budget Total : ${formData.budget}€
    - Intérêts : ${formData.interests}

    Crée un itinéraire détaillé jour par jour.
    IMPORTANT : Si le budget de ${formData.budget}€ semble trop bas pour ${formData.duration} jours à ${formData.destination} pour ${formData.travelers} personnes, fournis quand même un plan pour un budget minimum réaliste, mais commence par expliquer clairement pourquoi le budget initial est insuffisant et quel serait le budget minimum recommandé.
    
    Structure la réponse avec :
    1. Résumé du voyage (et avertissement budget si nécessaire)
    2. Itinéraire Jour par Jour (Matin, Après-midi, Soir)
    3. Estimation des coûts
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
        const response = await fetch(`${API_BASE}/chatbot/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message: message,
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

        // Update current plan data if the user wants to save the *updated* conversation context? 
        // Actually, usually we save the initial plan, but maybe we should update the "generatedPlan" 
        // to reflect the latest state of the conversation? 
        // For now, let's append the new interaction to the generated plan text so it's saved too.
        currentPlanData.generatedPlan += `\n\n---\n**Modification demandée :** ${message}\n\n**Réponse :** ${data.response}`;

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
