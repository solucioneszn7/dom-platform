import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ProveedorAutenticacion } from './contextos/ContextoAutenticacion'
import App from './App.jsx'
import './index.css'

if (localStorage.getItem('dom-tema-oscuro') === 'true') {
  document.documentElement.classList.add('dark')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ProveedorAutenticacion>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '10px',
              background: '#191919',
              color: '#ebebeb',
              fontSize: '14px',
              fontFamily: "'DM Sans', sans-serif",
              padding: '12px 16px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            },
          }}
        />
      </ProveedorAutenticacion>
    </BrowserRouter>
  </StrictMode>,
)
