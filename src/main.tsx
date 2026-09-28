import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { seedMockDataFromUrl } from './dev/mockData'
import './styles.css'

if (import.meta.env.DEV) seedMockDataFromUrl()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
