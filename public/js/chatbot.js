// Chatbot functionality
const CHATBOT_API = '/api/chatbot';

class Chatbot {
    constructor() {
        this.isOpen = false;
        this.conversationHistory = [];
        this.historyLoaded = false;
        this.init();
    }

    init() {
        const embeddedContainer = document.getElementById('embedded-chat-container');
        if (embeddedContainer) {
            this.isEmbedded = true;
            this.createEmbeddedChat(embeddedContainer);
        } else {
            this.isEmbedded = false;
            this.createChatWidget();
        }
        this.attachEventListeners();
        
        if (this.isEmbedded) {
            this.isOpen = true;
            this.loadHistory();
        }
    }

    createEmbeddedChat(container) {
        // Create chat window structure directly in the container
        container.innerHTML = `
            <div class="chat-window embedded" id="chat-window">
                <div class="chat-header">
                    <h3>
                        <span>🤖</span>
                        <span>Assistant Voyage</span>
                    </h3>
                    <!-- No close button for embedded chat -->
                </div>
                <div class="chat-messages" id="chat-messages">
                    <div class="chat-message bot">
                        <div class="message-avatar bot">🤖</div>
                        <div class="message-content">
                            Bonjour! Je suis votre assistant voyage. Je peux vous aider à trouver des destinations, des hôtels, et planifier votre voyage. Comment puis-je vous aider aujourd'hui?
                        </div>
                    </div>
                </div>
                <div class="typing-indicator" id="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
                <div class="chat-input-area">
                    <input 
                        type="text" 
                        class="chat-input" 
                        id="chat-input" 
                        placeholder="Posez votre question..."
                        autocomplete="off"
                    />
                    <button class="chat-send" id="chat-send" aria-label="Send message">
                        ➤
                    </button>
                    <button class="chat-clear" id="chat-clear" aria-label="Clear history" title="Effacer l'historique">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }

    createChatWidget() {
        // Create chat button
        const chatButton = document.createElement('button');
        chatButton.className = 'chat-button';
        chatButton.id = 'chat-button';
        chatButton.innerHTML = '💬';
        chatButton.setAttribute('aria-label', 'Open chat');

        // Create chat window
        const chatWindow = document.createElement('div');
        chatWindow.className = 'chat-window';
        chatWindow.id = 'chat-window';
        chatWindow.innerHTML = `
            <div class="chat-header">
                <h3>
                    <span>🤖</span>
                    <span>Assistant Voyage</span>
                </h3>
                <button class="chat-close" id="chat-close" aria-label="Close chat">×</button>
            </div>
            <div class="chat-messages" id="chat-messages">
                <div class="chat-message bot">
                    <div class="message-avatar bot">🤖</div>
                    <div class="message-content">
                        Bonjour! Je suis votre assistant voyage. Je peux vous aider à trouver des destinations, des hôtels, et planifier votre voyage. Comment puis-je vous aider aujourd'hui?
                    </div>
                </div>
            </div>
            <div class="typing-indicator" id="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
            <div class="chat-input-area">
                <input 
                    type="text" 
                    class="chat-input" 
                    id="chat-input" 
                    placeholder="Posez votre question..."
                    autocomplete="off"
                />
                <button class="chat-send" id="chat-send" aria-label="Send message">
                    ➤
                </button>
                <button class="chat-clear" id="chat-clear" aria-label="Clear history" title="Effacer l'historique">
                    🗑️
                </button>
            </div>
        `;

        document.body.appendChild(chatButton);
        document.body.appendChild(chatWindow);
    }

    attachEventListeners() {
        const chatButton = document.getElementById('chat-button');
        const chatWindow = document.getElementById('chat-window');
        const chatClose = document.getElementById('chat-close');
        const chatInput = document.getElementById('chat-input');
        const chatSend = document.getElementById('chat-send');
        const chatClear = document.getElementById('chat-clear');

        if (!this.isEmbedded) {
            if (chatButton) chatButton.addEventListener('click', () => this.toggleChat());
            if (chatClose) chatClose.addEventListener('click', () => this.toggleChat());
        }
        
        if (chatSend) chatSend.addEventListener('click', () => this.sendMessage());
        if (chatClear) chatClear.addEventListener('click', () => this.clearHistory());
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
    }

    toggleChat() {
        if (this.isEmbedded) return;

        // Check if user is logged in
        const token = localStorage.getItem('jwt');
        if (!token) {
            // User is not logged in, redirect to login page
            if (confirm('Vous devez être connecté pour utiliser l\'assistant voyage. Voulez-vous vous connecter maintenant?')) {
                window.location.href = '/html/login.html';
            }
            return;
        }

        const chatButton = document.getElementById('chat-button');
        const chatWindow = document.getElementById('chat-window');
        
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            // Load chat history when opening for the first time
            if (!this.historyLoaded) {
                this.loadHistory();
            }
            chatWindow.classList.add('open');
            chatButton.classList.add('active');
            chatButton.innerHTML = '✕';
            document.getElementById('chat-input').focus();
        } else {
            chatWindow.classList.remove('open');
            chatButton.classList.remove('active');
            chatButton.innerHTML = '💬';
        }
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();

        if (!message) return;

        // Add user message to UI
        this.addMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        // Disable send button
        const sendBtn = document.getElementById('chat-send');
        sendBtn.disabled = true;

        try {
            // Get auth token if available
            const token = localStorage.getItem('jwt');
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Send to backend
            const response = await fetch(`${CHATBOT_API}/chat`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    message: message,
                    conversationHistory: this.conversationHistory
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response from chatbot');
            }

            const data = await response.json();

            // Hide typing indicator
            this.hideTypingIndicator();

            // Add bot response to UI
            this.addMessage(data.response, 'bot');

            // If there are Expedia results, show them
            if (data.expediaResults && data.expediaResults.length > 0) {
                this.displayExpediaResults(data.expediaResults);
            }

            // If there are internal destinations, show them
            if (data.internalDestinations && data.internalDestinations.length > 0) {
                this.displayInternalDestinations(data.internalDestinations);
            }

        } catch (error) {
            console.error('Chat error:', error);
            this.hideTypingIndicator();
            this.addMessage('Désolé, une erreur s\'est produite. Veuillez réessayer.', 'bot');
        } finally {
            sendBtn.disabled = false;
        }
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('chat-messages');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = `message-avatar ${sender}`;
        avatar.innerHTML = sender === 'user' ? '👤' : '🤖';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = this.formatMessage(text);
        
        if (sender === 'user') {
            messageDiv.appendChild(content);
            messageDiv.appendChild(avatar);
        } else {
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(content);
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    formatMessage(text) {
        // Convert markdown-style links to HTML
        text = text.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // Convert line breaks
        text = text.replace(/\n/g, '<br>');
        
        // Convert bold text
        text = text.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
        
        return text;
    }

    showTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        indicator.classList.add('active');
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        indicator.classList.remove('active');
    }

    displayExpediaResults(results) {
        let resultText = '\n\n**Résultats Expedia:**\n';
        results.slice(0, 3).forEach((item, index) => {
            resultText += `\n${index + 1}. **${item.name || item.title}**`;
            if (item.price) resultText += ` - ${item.price}`;
            if (item.rating) resultText += ` ⭐ ${item.rating}`;
        });
        
        this.addMessage(resultText, 'bot');
    }

    displayInternalDestinations(destinations) {
        let resultText = '\n\n**Nos destinations disponibles:**\n';
        destinations.slice(0, 3).forEach((dest, index) => {
            resultText += `\n${index + 1}. **[${dest.name}](/html/destinations.html?id=${dest._id})** (${dest.category})`;
        });
        resultText += '\n\nCliquez sur un nom pour voir plus de détails!';
        
        this.addMessage(resultText, 'bot');
    }
    
    async loadHistory() {
        try {
            const token = localStorage.getItem('jwt');
            if (!token) return;

            const response = await fetch(`${CHATBOT_API}/history`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load chat history');
            }

            const data = await response.json();
            
            if (data.messages && data.messages.length > 0) {
                // Clear welcome message
                const messagesContainer = document.getElementById('chat-messages');
                messagesContainer.innerHTML = '';
                
                // Display all saved messages
                data.messages.forEach(msg => {
                    const sender = msg.role === 'user' ? 'user' : 'bot';
                    this.addMessage(msg.text, sender);
                });
            }
            
            this.historyLoaded = true;
        } catch (error) {
            console.error('Error loading chat history:', error);
            // Continue without history
            this.historyLoaded = true;
        }
    }

    async clearHistory() {
        if (!confirm('Êtes-vous sûr de vouloir effacer tout l\'historique de conversation?')) {
            return;
        }

        try {
            const token = localStorage.getItem('jwt');
            if (!token) return;

            const response = await fetch(`${CHATBOT_API}/history`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to clear chat history');
            }

            // Clear UI
            const messagesContainer = document.getElementById('chat-messages');
            messagesContainer.innerHTML = `
                <div class="chat-message bot">
                    <div class="message-avatar bot">🤖</div>
                    <div class="message-content">
                        Historique effacé. Comment puis-je vous aider aujourd'hui?
                    </div>
                </div>
            `;

            this.conversationHistory = [];
            
        } catch (error) {
            console.error('Error clearing chat history:', error);
            alert('Erreur lors de l\'effacement de l\'historique');
        }
    }
}

// Initialize chatbot when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new Chatbot();
    });
} else {
    new Chatbot();
}
