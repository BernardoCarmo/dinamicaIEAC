import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ensureSessionInitialized } from "./engine/firebaseActions";
import LoginPage from "./pages/LoginPage.jsx";
import WaitingRoomPage from "./pages/WaitingRoomPage.jsx";
import CountryPage from "./pages/CountryPage.jsx";
import MasterPanelPage from "./pages/MasterPanelPage.jsx";
import TelaoPage from "./pages/TelaoPage.jsx";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureSessionInitialized().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="page">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/espera" element={<WaitingRoomPage />} />
        <Route path="/pais" element={<CountryPage />} />
        <Route path="/painel" element={<MasterPanelPage />} />
        <Route path="/telao" element={<TelaoPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
