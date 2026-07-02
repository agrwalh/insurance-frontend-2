import { Link } from "react-router-dom";

export function MetricCard({ label, value, hint, icon = "●", tone = "emerald", trend }) {
  return (
    <div className={`metric-card metric-card-${tone}`}>
      <div className="metric-card-top">
        <span className="metric-icon">{icon}</span>
        {trend && <span className="metric-trend">{trend}</span>}
      </div>
      <span className="metric-value">{value}</span>
      <span className="metric-label">{label}</span>
      {hint && <p className="metric-hint">{hint}</p>}
    </div>
  );
}

export function DashboardSection({ title, subtitle, action, children }) {
  return (
    <section className="dashboard-section">
      <div className="dashboard-section-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ActionCard({ to, icon, label, desc, badge }) {
  return (
    <Link to={to} className="action-card">
      <div className="action-card-icon">{icon}</div>
      <div>
        <h3>{label}</h3>
        <p>{desc}</p>
      </div>
      {badge && <span className="action-card-badge">{badge}</span>}
    </Link>
  );
}

export function InsightPanel({ title, children, footer }) {
  return (
    <div className="insight-panel">
      <div className="insight-panel-head">
        <h3>{title}</h3>
      </div>
      <div className="insight-panel-body">{children}</div>
      {footer && <div className="insight-panel-footer">{footer}</div>}
    </div>
  );
}

export function StatusBreakdown({ items = [] }) {
  const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0);
  return (
    <div className="status-breakdown">
      {items.map((item) => {
        const percent = total > 0 ? Math.round((Number(item.value || 0) / total) * 100) : 0;
        return (
          <div key={item.label} className="status-row">
            <div className="status-row-meta">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
            <div className="status-track">
              <span className={`status-fill status-fill-${item.tone || "emerald"}`} style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}
      {total === 0 && <p className="muted-note">No data available yet.</p>}
    </div>
  );
}

export function ActivityList({ items = [], empty = "No recent activity." }) {
  if (!items.length) return <p className="muted-note">{empty}</p>;

  return (
    <ul className="activity-list">
      {items.map((item, index) => (
        <li key={item.id || index}>
          <span className={`activity-dot activity-dot-${item.tone || "emerald"}`} />
          <div>
            <strong>{item.title}</strong>
            {item.meta && <p>{item.meta}</p>}
          </div>
          {item.value && <span className="activity-value">{item.value}</span>}
        </li>
      ))}
    </ul>
  );
}
