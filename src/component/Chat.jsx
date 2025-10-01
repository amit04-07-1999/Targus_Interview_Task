import { useState, useRef, useEffect } from 'react';
import { sendChatMessage, sendChatMessageAlternative, getCollections } from '../services/api';
import './Chat.css';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [availableCollections, setAvailableCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [chatHistory, setChatHistory] = useState({}); // Store chat history for each collection
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchAvailableCollections = async () => {
    setLoadingCollections(true);
    try {
      const data = await getCollections();
      
      let collections = [];
      if (Array.isArray(data)) {
        collections = data.map(item => item.name || item);
      } else if (data.collections && Array.isArray(data.collections)) {
        collections = data.collections.map(item => item.name || item);
      } else if (typeof data === 'object' && data !== null) {
        collections = Object.keys(data);
      }
      
      setAvailableCollections(collections);
      
      // Auto-select first collection if none selected
      if (collections.length > 0 && !selectedCollection) {
        setSelectedCollection(collections[0]);
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      // Fallback to default options
      setAvailableCollections(['documents', 'knowledge', 'general']);
      if (!selectedCollection) {
        setSelectedCollection('documents');
      }
    } finally {
      setLoadingCollections(false);
    }
  };

  useEffect(() => {
    fetchAvailableCollections();
    
    // Load chat history from localStorage
    const savedChatHistory = localStorage.getItem('chatHistory');
    if (savedChatHistory) {
      try {
        const parsed = JSON.parse(savedChatHistory);
        // Convert timestamp strings back to Date objects
        const convertedHistory = {};
        Object.keys(parsed).forEach(collection => {
          convertedHistory[collection] = parsed[collection].map(message => ({
            ...message,
            timestamp: new Date(message.timestamp)
          }));
        });
        setChatHistory(convertedHistory);
      } catch (error) {
        console.error('Failed to parse saved chat history:', error);
      }
    }
  }, []);

  // Load chat history when collection changes
  useEffect(() => {
    if (selectedCollection && chatHistory[selectedCollection]) {
      setMessages(chatHistory[selectedCollection]);
    } else if (selectedCollection) {
      setMessages([]); // Clear messages for new collections
    }
  }, [selectedCollection, chatHistory]);

  // Save chat history when messages change
  useEffect(() => {
    if (selectedCollection && messages.length > 0) {
      const newChatHistory = {
        ...chatHistory,
        [selectedCollection]: messages
      };
      setChatHistory(newChatHistory);
      
      // Save to localStorage
      localStorage.setItem('chatHistory', JSON.stringify(newChatHistory));
    }
  }, [messages, selectedCollection]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    if (!selectedCollection) {
      setError('Please select a collection first');
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setError('');

    // Add user message to chat
    setMessages(prev => [...prev, { 
      id: Date.now(), 
      text: userMessage, 
      sender: 'user',
      timestamp: new Date()
    }]);

    setIsLoading(true);

    try {
      let response;
      try {
        response = await sendChatMessage(userMessage, selectedCollection);
      } catch (error) {
        //console.log('Standard chat message failed, trying alternative formats:', error.message);
        response = await sendChatMessageAlternative(userMessage, selectedCollection);
      }
      
      // Add bot response to chat
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: response.message || response.response || 'No response received', 
        sender: 'bot',
        timestamp: new Date()
      }]);
    } catch (error) {
      setError(`Failed to send message: ${error.message}`);
      
      // Add error message to chat
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: 'Sorry, I encountered an error. Please try again.', 
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const clearChat = () => {
    if (selectedCollection) {
      setMessages([]);
      const newChatHistory = {
        ...chatHistory,
        [selectedCollection]: []
      };
      setChatHistory(newChatHistory);
      localStorage.setItem('chatHistory', JSON.stringify(newChatHistory));
    }
    setError('');
  };

  const clearAllChats = () => {
    if (window.confirm('Are you sure you want to clear all chat histories?')) {
      setMessages([]);
      setChatHistory({});
      localStorage.removeItem('chatHistory');
      setError('');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Chat</h2>
        <div className="header-controls">
          <div className="collection-selector">
            <label htmlFor="collection-select">Collection:</label>
            <select 
              id="collection-select"
              value={selectedCollection} 
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="collection-select"
              disabled={loadingCollections}
            >
              {loadingCollections ? (
                <option value="">Loading collections...</option>
              ) : availableCollections.length === 0 ? (
                <option value="">No collections available</option>
              ) : (
                availableCollections.map((collection) => (
                  <option key={collection} value={collection}>
                    {collection}
                  </option>
                ))
              )}
            </select>
          </div>
          <button 
            className="refresh-collections-button"
            onClick={fetchAvailableCollections}
            disabled={loadingCollections}
            title="Refresh collections"
          >
            <svg className="refresh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="23,4 23,10 17,10"/>
              <polyline points="1,20 1,14 7,14"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
          </button>
          <button className="clear-button" onClick={clearChat}>
            Clear Current
          </button>
          <button className="clear-all-button" onClick={clearAllChats}>
            Clear All
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>Start a conversation with the <strong>{selectedCollection}</strong> collection</p>
            {availableCollections.length > 1 && (
              <p className="collection-info">
                You have {availableCollections.length} collections available. 
                Switch between them to see separate chat histories.
              </p>
            )}
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.sender} ${message.isError ? 'error' : ''}`}
            >
              <div className="message-content">
                <div className="message-text">{message.text}</div>
                <div className="message-time">
                  {message.timestamp instanceof Date 
                    ? message.timestamp.toLocaleTimeString()
                    : new Date(message.timestamp).toLocaleTimeString()
                  }
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="message bot">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <div className="input-container">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className="message-input"
            rows="1"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={!inputMessage.trim() || isLoading}
          >
            <svg className="send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22,2 15,22 11,13 2,9 22,2"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
