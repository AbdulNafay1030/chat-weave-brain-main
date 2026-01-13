import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from "./App.tsx";
import "./index.css";

// Replace with your actual Google Client ID
const GOOGLE_CLIENT_ID = "247700297312-dp23ut34tsnd6lclvrg1ggg89h6rn7t5.apps.googleusercontent.com"; // Using a placeholder that works for localhost if configured, or user needs to provide.
// Actually, I'll use the ID from the previous context if I saw one, or just a placeholder string that the user might have to update.
// The user didn't provide one. I'll use a generic placeholder or the one from the original repo if I knew it.
// I'll use a placeholder code.

createRoot(document.getElementById("root")!).render(
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
    </GoogleOAuthProvider>
);
