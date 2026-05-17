import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { UIProvider } from "./context/UIContext";
import { DebugProvider } from "./context/DebugContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import './index.css'
import App from './App.tsx'
import { Toaster } from "@/components/ui/sonner";

const isProduction = import.meta.env.PROD;

const app = (
    <GoogleOAuthProvider
        clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
    >
        <UIProvider>
            <App />
            <Toaster />
        </UIProvider>
    </GoogleOAuthProvider>
);

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        {isProduction ? app : <DebugProvider>{app}</DebugProvider>}
    </StrictMode>
);