import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFirebaseValue } from "../hooks/useFirebaseValue";
import TutorialSlide from "../components/tutorial/TutorialSlide.jsx";
import { TUTORIAL_SLIDES } from "../config/tutorialSlides";

export default function WaitingRoomPage() {
  const navigate = useNavigate();
  const leaderId = localStorage.getItem("leaderId");
  const [leaders] = useFirebaseValue("session/leaders");
  const [assignment] = useFirebaseValue("session/assignment");
  const [tutorialSlide] = useFirebaseValue("session/tutorialSlide");

  useEffect(() => {
    if (!leaderId) {
      navigate("/", { replace: true });
    }
  }, [leaderId, navigate]);

  useEffect(() => {
    if (leaders && leaderId && !leaders[leaderId]) {
      // O mestre reiniciou o jogo ou a sessão expirou.
      localStorage.removeItem("leaderId");
      navigate("/", { replace: true });
    }
  }, [leaders, leaderId, navigate]);

  useEffect(() => {
    if (assignment && leaderId && Object.values(assignment).includes(leaderId)) {
      navigate("/pais", { replace: true });
    }
  }, [assignment, leaderId, navigate]);

  const leaderList = Object.entries(leaders || {}).sort((a, b) => a[1].joinedAt - b[1].joinedAt);

  if (tutorialSlide != null) {
    return (
      <div className="page" style={{ justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div className="container" style={{ display: "flex", justifyContent: "center" }}>
          <TutorialSlide slide={TUTORIAL_SLIDES[tutorialSlide]} index={tutorialSlide} total={TUTORIAL_SLIDES.length} />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 520, marginTop: "8vh" }}>
        <div className="card">
          <h2>Sala de espera</h2>
          <p>Aguardando o mestre sortear os países. Não feche esta página.</p>

          <div className="section-title" style={{ marginTop: 20 }}>
            Líderes na sala ({leaderList.length}/6)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {leaderList.map(([id, data]) => (
              <div
                key={id}
                className="card"
                style={{
                  padding: "10px 16px",
                  background: id === leaderId ? "var(--bg-panel)" : "var(--bg-card)",
                  border: id === leaderId ? "1px solid var(--accent)" : undefined,
                }}
              >
                {data.name} {id === leaderId && <strong>(você)</strong>}
              </div>
            ))}
            {leaderList.length === 0 && <p>Ninguém entrou ainda.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
