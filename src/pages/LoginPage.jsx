import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { get, ref as dbRef } from "firebase/database";
import { db } from "../firebase";
import { MASTER_PASSWORD } from "../config/gameConfig";
import { joinAsLeader } from "../engine/firebaseActions";

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("lider");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Reconexão automática: se este navegador já é um líder ou mestre, pula o login.
    const leaderId = localStorage.getItem("leaderId");
    const isMestre = sessionStorage.getItem("isMestre") === "true";
    if (isMestre) {
      navigate("/painel", { replace: true });
      return;
    }
    if (leaderId) {
      get(dbRef(db, `session/leaders/${leaderId}`)).then((snap) => {
        if (snap.exists()) {
          get(dbRef(db, `session/assignment`)).then((assignSnap) => {
            const assignment = assignSnap.val() || {};
            const hasCountry = Object.values(assignment).includes(leaderId);
            navigate(hasCountry ? "/pais" : "/espera", { replace: true });
          });
        } else {
          localStorage.removeItem("leaderId");
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLeaderSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      const leaderId = await joinAsLeader(name.trim());
      localStorage.setItem("leaderId", leaderId);
      navigate("/espera");
    } catch (err) {
      setError("Não foi possível entrar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  function handleMestreSubmit(e) {
    e.preventDefault();
    if (password === MASTER_PASSWORD) {
      sessionStorage.setItem("isMestre", "true");
      navigate("/painel");
    } else {
      setError("Senha incorreta.");
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 420, marginTop: "10vh" }}>
        <div className="card">
          <h1 style={{ textAlign: "center" }}>PIB, Inflação e Leilão</h1>
          <p style={{ textAlign: "center" }}>Dinâmica de macroeconomia em sala</p>

          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <button
              className="btn"
              style={{ flex: 1, opacity: tab === "lider" ? 1 : 0.5 }}
              onClick={() => {
                setTab("lider");
                setError("");
              }}
            >
              Sou Líder
            </button>
            <button
              className="btn"
              style={{ flex: 1, opacity: tab === "mestre" ? 1 : 0.5 }}
              onClick={() => {
                setTab("mestre");
                setError("");
              }}
            >
              Sou Mestre
            </button>
          </div>

          {tab === "lider" ? (
            <form onSubmit={handleLeaderSubmit}>
              <label className="section-title">Seu nome</label>
              <input
                type="text"
                placeholder="Digite seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <div style={{ height: 14 }} />
              <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: "100%" }}>
                Entrar na sala de espera
              </button>
            </form>
          ) : (
            <form onSubmit={handleMestreSubmit}>
              <label className="section-title">Senha do mestre</label>
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <div style={{ height: 14 }} />
              <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>
                Entrar no painel
              </button>
            </form>
          )}

          {error && <p style={{ color: "var(--negative)", marginTop: 12 }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}
