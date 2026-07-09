/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Root application coordinator managing routing, global components, and views.
 *
 * App shell. Sets up routing, the top navigation bar, and page-level layout.
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { NavBar } from './components/layout/NavBar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './components/about/AboutPage';

// Restores scroll position to top of viewport on every route transition
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Framer-motion 11 typings pair badly with TS 4.9 — cast to any component
// so we can still use AnimatePresence's exit animations without noise.
const AnimatePresenceAny = AnimatePresence as unknown as React.FC<
  React.PropsWithChildren<{
    mode?: 'sync' | 'popLayout' | 'wait';
    initial?: boolean;
    onExitComplete?: () => void;
  }>
>;

// Premium fade-and-slide page transition wrapper
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex-1 flex flex-col"
    >
      {children}
    </motion.div>
  );
};

const AppContent: React.FC = () => {
  const [historyOpen, setHistoryOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-bg-base text-ink-primary">
      <NavBar onOpenHistory={() => setHistoryOpen(true)} />
      <main className="flex-1 relative z-20 pt-[56px] md:pt-[64px] flex flex-col">
        <AnimatePresenceAny mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <PageTransition>
                  <HomePage
                    historyOpen={historyOpen}
                    onHistoryClose={() => setHistoryOpen(false)}
                  />
                </PageTransition>
              }
            />
            <Route
              path="/about"
              element={
                <PageTransition>
                  <AboutPage />
                </PageTransition>
              }
            />
            <Route
              path="*"
              element={
                <PageTransition>
                  <HomePage
                    historyOpen={historyOpen}
                    onHistoryClose={() => setHistoryOpen(false)}
                  />
                </PageTransition>
              }
            />
          </Routes>
        </AnimatePresenceAny>
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
