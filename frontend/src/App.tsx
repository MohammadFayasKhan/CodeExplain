/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Root application coordinator managing routing, global components, and views.
 *
 * App shell. Sets up routing, the top navigation bar, and page-level layout.
 */

import React, { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { NavBar } from './components/layout/NavBar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './components/about/AboutPage';

const App: React.FC = () => {
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-bg-base text-ink-primary">
        <NavBar onOpenHistory={() => setHistoryOpen(true)} />
        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  historyOpen={historyOpen}
                  onHistoryClose={() => setHistoryOpen(false)}
                />
              }
            />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={
              <HomePage
                historyOpen={historyOpen}
                onHistoryClose={() => setHistoryOpen(false)}
              />
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
