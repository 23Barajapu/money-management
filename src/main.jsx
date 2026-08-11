import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', textAlign: 'center', color: '#f8fafc' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#ef4444' }}>Terjadi Kesalahan Aplikasi</h2>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem', maxWidth: '500px' }}>
            {this.state.error?.message || 'Gagal memuat aplikasi.'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '0.75rem 1.5rem', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
          >
            Muat Ulang (Reload)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

