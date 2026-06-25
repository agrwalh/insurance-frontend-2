import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const CUSTOMER_LINKS = [
  { to: "/customer/dashboard", label: "Dashboard", icon: "⚡" },
  { to: "/customer/profile",   label: "My Profile",    icon: "👤" },
  { to: "/customer/plans",     label: "Browse Plans",  icon: "🛡️" },
  { to: "/customer/policies",  label: "My Policies",   icon: "📋" },
  { to: "/customer/claims",    label: "My Claims",     icon: "🔍" },
  { to: "/customer/claims/new",label: "File a Claim",  icon: "📝" },
];

const AGENT_LINKS = [
  { to: "/agent/dashboard", label: "Dashboard",     icon: "⚡" },
  { to: "/agent/claims",    label: "Review Claims", icon: "🔎" },
  { to: "/agent/policies",  label: "All Policies",  icon: "📋" },
  { to: "/agent/payments",  label: "All Payments",  icon: "💳" },
];

const ADMIN_LINKS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: "⚡" },
  { to: "/admin/products",  label: "Products",  icon: "📦" },
  { to: "/admin/plans",     label: "Plans",     icon: "🗂️" },
  { to: "/admin/policies",  label: "Policies",  icon: "📋" },
  { to: "/admin/claims",    label: "Claims",    icon: "⚖️" },
  { to: "/admin/payments",  label: "Payments",  icon: "💰" },
  { to: "/admin/users",     label: "Users",     icon: "👥" },
  { to: "/admin/business-tools", label: "Business Tools", icon: "🧰" },
];

export default function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const links = user.role === "ADMIN" ? ADMIN_LINKS : user.role === "AGENT" ? AGENT_LINKS : CUSTOMER_LINKS;

  return (
    <aside className="sidebar">
      {/* User chip */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.65rem",
        padding: "0.6rem 0.75rem 1.1rem",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        marginBottom: "0.75rem"
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: "var(--em)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.8rem",
          color: "white", flexShrink: 0
        }}>
          {user.fullName.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: "0.83rem", color: "white",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user.fullName}
          </p>
          <p style={{ fontSize: "0.67rem", color: "var(--slate-400)",
            textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {user.role}
          </p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
          >
            <span style={{ fontSize: "0.95rem", lineHeight: 1 }}>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
