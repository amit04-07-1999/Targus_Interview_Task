import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Upload from './component/Upload';
import Chat from './component/Chat';
import Collection from './component/Collection';
import HealthIndicator from './component/HealthIndicator';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Upload />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/collections" element={<Collection />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

function Header() {
  const location = useLocation();

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo">
          <h1>Targus App</h1>
        </div>
        <nav className="navigation">
          <Link 
            to="/upload" 
            className={`nav-link ${location.pathname === '/' || location.pathname === '/upload' ? 'active' : ''}`}
          >
            Upload
          </Link>
          <Link 
            to="/chat" 
            className={`nav-link ${location.pathname === '/chat' ? 'active' : ''}`}
          >
            Chat
          </Link>
          <Link 
            to="/collections" 
            className={`nav-link ${location.pathname === '/collections' ? 'active' : ''}`}
          >
            Collections
          </Link>
        </nav>
        <div className="header-status">
          <HealthIndicator />
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p>&copy; 2024 Targus Interview Task</p>
        <div className="footer-status">
          <HealthIndicator />
        </div>
      </div>
    </footer>
  );
}

export default App;
