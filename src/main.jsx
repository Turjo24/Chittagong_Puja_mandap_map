import { createRoot } from 'react-dom/client'
// Self-hosted fonts (same weights as the old Google Fonts link) — no third-party font request,
// so the page does not depend on fonts.googleapis.com / fonts.gstatic.com being reachable.
import '@fontsource/hind-siliguri/bengali-400.css'
import '@fontsource/hind-siliguri/bengali-500.css'
import '@fontsource/hind-siliguri/bengali-600.css'
import '@fontsource/hind-siliguri/latin-400.css'
import '@fontsource/hind-siliguri/latin-500.css'
import '@fontsource/hind-siliguri/latin-600.css'
import '@fontsource/noto-serif-bengali/bengali-500.css'
import '@fontsource/noto-serif-bengali/bengali-700.css'
import '@fontsource/noto-serif-bengali/latin-500.css'
import '@fontsource/noto-serif-bengali/latin-700.css'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/cormorant-garamond/latin-600.css'
import '@fontsource/cormorant-garamond/latin-700.css'
import "@fontsource/hind-siliguri/bengali-400.css";
import App from './App'
createRoot(document.getElementById('root')).render(<App />)
