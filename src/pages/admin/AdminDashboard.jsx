import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const TILES = [
  { to: "/admin/products", icon: "📦", label: "Products", desc: "Create and manage insurance product categories." },
  { to: "/admin/plans", icon: "🗂️", label: "Plans", desc: "Manage all plans and their pricing details." },
  { to: "/admin/policies", icon: "📋", label: "Policies", desc: "View and manage all issued policies." },
  { to: "/admin/claims", icon: "⚖️", label: "Claims", desc: "Make final decisions on agent-reviewed claims." },
  { to: "/admin/payments", icon: "💰", label: "Payments", desc: "View all payment records and transaction history." },
  { to: "/admin/users", icon: "👥", label: "Users", desc: "Manage agents and view all platform users." },
];

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <div className="dash-hero" style={{
        backgroundImage: "linear-gradient(120deg, rgba(11,17,32,0.88) 0%, rgba(11,17,32,0.55) 100%), url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=80&auto=format&fit=crop')"
      }}>
        <h1>Admin Console 🖥️</h1>
        <p>Manage products, plans, claims, payments and users from one place.</p>
        <div className="dash-stats">
          <div className="dash-stat">
            <span className="dash-stat-value">Admin</span>
            <span className="dash-stat-label">Access Level</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-value">Full</span>
            <span className="dash-stat-label">Permissions</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-value">Live</span>
            <span className="dash-stat-label">System Status</span>
          </div>
        </div>
      </div>

      <div className="page-header">
        <h1 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Management sections</h1>
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
