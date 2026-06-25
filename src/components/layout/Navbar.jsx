import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [showAgentModal, setShowAgentModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const talkToAgent = () => {
    setShowAgentModal(true);
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-brand">
          <div className="brand-mark">SC</div>
          <span className="brand-name">SecureCover</span>
        </div>

        <div className="navbar-right">
          {/* Theme Toggle */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${
              theme === "light" ? "dark" : "light"
            } mode`}
            title={`Switch to ${
              theme === "light" ? "dark" : "light"
            } mode`}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          {/* Talk to Agent */}
          <button className="expert-talk" onClick={talkToAgent}>
            📞 Talk to Agent
          </button>

          {user && (
            <>
              <div className="navbar-user">
                <span className="user-name">{user.fullName}</span>
                <span className="user-role">{user.role}</span>
              </div>

              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      {/* Agent Modal */}
      {showAgentModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAgentModal(false)}
        >
          <div
            className="agent-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Talk to an Insurance Expert</h2>

            <p>
              Need help choosing a policy or filing a claim?
              <br />
              Our support team is available to assist you.
            </p>

            <h3>📞 +91 98765 43210</h3>

            <div className="modal-buttons">
              <a href="tel:+919876543210" className="call-btn">
                Call Now
              </a>

              <button
                className="close-btn"
                onClick={() => setShowAgentModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}