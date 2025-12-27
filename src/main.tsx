import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ServiceProvider } from './hooks/useServices'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ServiceProvider>
      <App />
    </ServiceProvider>
  </StrictMode>,
)
