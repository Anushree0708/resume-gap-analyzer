import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AnalyzePage from './pages/AnalyzePage';
import HistoryPage from './pages/HistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AuthPage from './pages/AuthPage.tsx'
import { isLoggedIn, getEmail, clearToken } from './api/client';

export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean>(isLoggedIn);
  const [userEmail, setUserEmail] = useState<string | null>(getEmail);

  function handleAuth(email: string) {
    setUserEmail(email);
    setLoggedIn(true);
  }

  function handleLogout() {
    clearToken();
    setUserEmail(null);
    setLoggedIn(false);
  }

  if (!loggedIn) {
    return <AuthPage onAuth={handleAuth} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar userEmail={userEmail} onLogout={handleLogout} />
        <main className="pb-16">
          <Routes>
            <Route path="/" element={<AnalyzePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            {/* Catch-all: redirect unknown paths to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
