import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { Home } from './routes/Home';
import { CallConsole } from './routes/CallConsole';
import { Metrics } from './routes/Metrics';

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-content">
          <Link to="/" className="app-logo">
            <span className="app-logo-text">Kol</span>
            <span className="app-logo-star">✦</span>
          </Link>
          <nav className="app-nav">
            <NavLink to="/" end>
              <span className="nav-step">01</span> Choose
            </NavLink>
            <NavLink to="/console">
              <span className="nav-step">02</span> Connect
            </NavLink>
            <NavLink to="/metrics">
              <span className="nav-step">03</span> Optimize
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/console" element={<CallConsole />} />
          <Route path="/metrics" element={<Metrics />} />
        </Routes>
      </main>
    </div>
  );
}
