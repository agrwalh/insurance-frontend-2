import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const TILES = [
  { to: "/agent/claims", icon: "🔎", label: "Review Claims", desc: "Review submitted claims and provide your recommendation." },
  { to: "/agent/policies", icon: "📋", label: "All Policies", desc: "View every policy issued across all customers." },
  { to: "/agent/payments", icon: "💳", label: "All Payments", desc: "Track payment records across all active policies." },
];

export default function AgentDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <div className="dash-hero" style={{
        backgroundImage: "linear-gradient(120deg, rgba(11,17,32,0.85) 0%, rgba(11,17,32,0.55) 100%), url('https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=1400&q=80&auto=format&fit=crop')"
      }}>
        <h1>Welcome, {user.fullName.split(" ")[0]} 👋</h1>
        <p>Review claims, monitor policies and track all payment activity.</p>
        <div className="dash-stats">
          <div className="dash-stat">
            <span className="dash-stat-value">Agent</span>
            <span className="dash-stat-label">Your Role</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-value">Active</span>
            <span className="dash-stat-label">Status</span>
          </div>
        </div>
      </div>

      <div className="page-header">
        <h1 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Your workspace</h1>
      </div>

      <div className="dashboard-grid">
        {TILES.map((tile) => (
          <Link key={tile.to} to={tile.to} className="dashboard-tile">
            <div className="tile-icon">{tile.icon}</div>
            <h3>{tile.label}</h3>
            <p>{tile.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
