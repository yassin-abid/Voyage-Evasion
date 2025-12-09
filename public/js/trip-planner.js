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

    // Check for saved plan ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('planId');
    if (planId) {
        loadSavedPlan(planId);
    }
});

async function loadSavedPlan(planId) {
    try {
        const token = localStorage.getItem('jwt');
        const response = await fetch(`${API_BASE}/trip-plans/${planId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to load plan');

        const plan = await response.json();
        currentPlanData = plan;

        // Reconstruct conversation history context to mimic the original generation
        // This helps the chatbot understand the context better for refinement
        const originalPrompt = `
    Je veux planifier un voyage avec les détails suivants :
    - Ville de départ : ${plan.departure}
    - Destination : ${plan.destination}
    - Durée : ${plan.duration} jours
    - Voyageurs : ${plan.travelers}
    - Date de début : ${plan.startDate || 'Non spécifiée'}
    - Budget Total : ${plan.budget}€
    - Intérêts : ${plan.interests}

    Crée un itinéraire détaillé jour par jour.
    IMPORTANT : Si le budget de ${plan.budget}€ semble trop bas pour ${plan.duration} jours à ${plan.destination} (incluant le transport depuis ${plan.departure}) pour ${plan.travelers} personnes, fournis quand même un plan pour un budget minimum réaliste, mais commence par expliquer clairement pourquoi le budget initial est insuffisant et quel serait le budget minimum recommandé.
    
    Structure la réponse avec :
    1. Résumé du voyage (incluant options de transport depuis ${plan.departure})
    2. Itinéraire Jour par Jour (Matin, Après-midi, Soir)
    3. Estimation des coûts (Transport, Logement, Activités, Nourriture)
    4. Conseils pratiques
    `;

        conversationHistory = [
            { role: 'user', text: originalPrompt },
            { role: 'model', text: plan.generatedPlan }
        ];

        displayPlan(plan.generatedPlan);
        showResults();

    } catch (error) {
        console.error('Error loading plan:', error);
        alert('Impossible de charger le plan sauvegardé.');
    }
}

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
        let url = `${API_BASE}/trip-plans`;
        let method = 'POST';

        if (currentPlanData._id) {
            url = `${API_BASE}/trip-plans/${currentPlanData._id}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(currentPlanData)
        });

        if (!response.ok) throw new Error('Failed to save plan');

        const savedPlan = await response.json();
        
        // If it was a new plan, update currentPlanData with the new ID
        if (!currentPlanData._id) {
            currentPlanData = savedPlan;
        }

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
        
        // Inject the current plan context into the message
        // This ensures the bot knows exactly what plan we are talking about
        const currentPlanText = currentPlanData ? currentPlanData.generatedPlan : 'Aucun plan actuel.';
        
        const enhancedMessage = `
CONTEXTE ACTUEL (Voici l'itinéraire que l'utilisateur consulte en ce moment) :
--- DÉBUT DU PLAN ---
${currentPlanText}
--- FIN DU PLAN ---

DEMANDE DE L'UTILISATEUR :
${message}

INSTRUCTIONS POUR LE BOT :
1. Utilisez le "CONTEXTE ACTUEL" ci-dessus pour répondre aux questions.
2. Si la demande implique une MODIFICATION ou un AJOUT D'INFORMATION :
   - Vous DEVEZ régénérer l'itinéraire COMPLET mis à jour.
   - CRUCIAL : Ajoutez tout en haut du plan une note brève décrivant la modification.
   - Si l'utilisateur CHOISIT une option (ex: "Je choisis l'hôtel Ibis") :
     a) SUPPRIMEZ la liste des suggestions précédentes (ne gardez pas les options non choisies).
     b) INTÉGREZ le choix dans le plan (ex: mettez à jour la section "Hébergement" avec l'hôtel choisi).
     c) Si le choix est ambigu (ex: pour quels jours ?), vous pouvez poser UNE question de clarification à la fin de la note en haut, mais générez quand même le plan avec le choix par défaut (ex: pour tout le séjour).
   - Le résultat final DOIT être le plan complet mis à jour.
3. Si la demande est une simple question de lecture, répondez par texte.
4. Si la demande est impossible, expliquez pourquoi.
`;

        const response = await fetch(`${API_BASE}/chatbot/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message: enhancedMessage,
                // We send a simplified history to avoid token limits, relying on the injected context
                conversationHistory: [] 
            })
        });

        if (!response.ok) throw new Error('Failed to get response');

        const data = await response.json();
        
        // Update history
        conversationHistory.push({ role: 'user', text: message });
        conversationHistory.push({ role: 'model', text: data.response });

        // Heuristic to check if it's a full plan or just a message
        // A plan usually contains "Jour 1" or is quite long (> 500 chars)
        const isFullPlan = data.response.includes("Jour 1") || data.response.length > 500;

        if (isFullPlan) {
            // It's a plan update
            addChatMessage("✅ Modifications effectuées ! L'itinéraire à gauche a été mis à jour.", 'bot');
            
            // Update the current plan data with the NEW full response
            currentPlanData.generatedPlan = data.response;
            
            // Also update the main display to show the new plan
            displayPlan(data.response);
        } else {
            // It's just a message/explanation (error or refusal)
            addChatMessage(data.response, 'bot');
            // Do NOT update the plan on the left
        }

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
