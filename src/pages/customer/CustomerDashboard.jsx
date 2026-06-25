import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const TILES = [
  { to: "/customer/plans", icon: "🛡️", label: "Browse Plans", desc: "Explore health, motor, life and travel insurance plans." },
  { to: "/customer/policies", icon: "📋", label: "My Policies", desc: "View active policies and complete pending payments." },
  { to: "/customer/claims/new", icon: "📝", label: "File a Claim", desc: "Submit a new claim against any active policy." },
  { to: "/customer/claims", icon: "🔍", label: "My Claims", desc: "Track and monitor the status of submitted claims." },
  { to: "/customer/profile", icon: "👤", label: "My Profile", desc: "Update your personal details and nominee information." },
];

export default function CustomerDashboard() {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero banner */}
      <div className="dash-hero">
        <h1>Hey let's find , {user.fullName.split(" ")[0]} the best insurance plan </h1>
        <p>Manage your insurance portfolio, track claims and stay protected.</p>
        <div className="dash-stats">
          <div className="dash-stat">
            <span className="dash-stat-value">Active</span>
            <span className="dash-stat-label">Account Status</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-value">24/7</span>
            <span className="dash-stat-label">Support</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-value">100%</span>
            <span className="dash-stat-label">Digital</span>
          </div>
        </div>
      </div>

      <div className="page-header">
        <h1 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Quick actions</h1>
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
