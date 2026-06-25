import { useEffect, useState } from "react";
import { claimApi } from "../../api/claimApi";
import { userApi } from "../../api/userApi";
import { settlementApi } from "../../api/settlementApi";
import { auditApi } from "../../api/auditApi";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { extractErrorMessage } from "../../utils/validators";

export default function AdminBusinessTools() {
  const [claims, setClaims] = useState([]);
  const [agents, setAgents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [claimId, setClaimId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [risk, setRisk] = useState(null);
  const [settlement, setSettlement] = useState(null);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedClaim = claims.find((c) => String(c.claimId) === String(claimId));

  const loadInitial = async () => {
    setError("");
    try {
      const [claimsRes, usersRes, auditRes] = await Promise.all([
        claimApi.getAll({ page: 0, size: 100, sortBy: "createdAt", direction: "desc" }),
        userApi.getAll({ page: 0, size: 100, role: "AGENT", sortBy: "createdAt", direction: "desc" }),
        auditApi.getAll({ page: 0, size: 20, sortBy: "createdAt", direction: "desc" }),
      ]);
      setClaims(claimsRes.data.data.content || []);
      setAgents((usersRes.data.data.content || []).filter((u) => u.role === "AGENT" && u.isActive));
      setAuditLogs(auditRes.data.data.content || []);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not load business tools data."));
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const runAction = async (action, successMessage) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await action();
      setMessage(successMessage);
      await loadInitial();
      return result;
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = () => {
    if (!claimId || !agentId) return setError("Select claim and agent first.");
    runAction(() => claimApi.assign(claimId, agentId), "Claim assigned successfully.");
  };

  const handleRisk = async () => {
    if (!claimId) return setError("Select a claim first.");
    const res = await runAction(() => claimApi.riskAssessment(claimId), "Risk assessment loaded.");
    if (res) setRisk(res.data.data);
  };

  const handleInitiateSettlement = async () => {
    if (!claimId || !approvedAmount) return setError("Select claim and enter approved amount.");
    const res = await runAction(
      () => settlementApi.initiate(claimId, { approvedAmount: Number(approvedAmount) }),
      "Settlement initiated."
    );
    if (res) setSettlement(res.data.data);
  };

  const handleFetchSettlement = async () => {
    if (!claimId) return setError("Select a claim first.");
    const res = await runAction(() => settlementApi.getByClaim(claimId), "Settlement fetched.");
    if (res) setSettlement(res.data.data);
  };

  const handleMarkPaid = async () => {
    if (!settlement?.settlementId || !paymentReference) return setError("Fetch/initiate settlement and enter payment reference.");
    const res = await runAction(
      () => settlementApi.markPaid(settlement.settlementId, { paymentReference }),
      "Settlement marked as paid."
    );
    if (res) setSettlement(res.data.data);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Business Tools</h1>
        <p className="page-subtitle">Verify assignment, risk assessment, settlement and audit logs</p>
      </div>

      <div className="business-metric-grid">
        <div className="business-metric">
          <span>Total Claims</span>
          <strong>{claims.length}</strong>
        </div>
        <div className="business-metric">
          <span>Active Agents</span>
          <strong>{agents.length}</strong>
        </div>
        <div className="business-metric">
          <span>Audit Events</span>
          <strong>{auditLogs.length}</strong>
        </div>
      </div>

      <Alert type="error" message={error} onClose={() => setError("")} />
      <Alert type="success" message={message} onClose={() => setMessage("")} />

      <div className="detail-grid">
        <Card title="Claim Assignment & Risk">
          <Select
            label="Claim"
            value={claimId}
            onChange={(e) => { setClaimId(e.target.value); setRisk(null); setSettlement(null); }}
            placeholder="Select claim"
            options={claims.map((c) => ({ value: c.claimId, label: `${c.claimNumber} — ${c.customerName} — ${c.claimStatus}` }))}
          />
          {selectedClaim && (
            <p className="form-section-hint">
              Status: <StatusBadge status={selectedClaim.claimStatus} /> · Amount: {formatCurrency(selectedClaim.claimAmount)}
              {selectedClaim.assignedAgentName ? ` · Assigned to: ${selectedClaim.assignedAgentName}` : " · Unassigned"}
            </p>
          )}
          <Select
            label="Agent"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="Select active agent"
            options={agents.map((a) => ({ value: a.userId, label: `${a.fullName} (${a.email})` }))}
          />
          <div className="modal-actions">
            <Button onClick={handleAssign} loading={loading}>Assign Claim</Button>
            <Button type="button" variant="secondary" onClick={handleRisk} loading={loading}>Check Risk</Button>
          </div>
          {risk && (
            <div style={{ marginTop: "1rem" }}>
              <h4>Risk: {risk.riskLevel} ({risk.riskScore}/100)</h4>
              <ul>{risk.reasons?.map((r) => <li key={r}>{r}</li>)}</ul>
            </div>
          )}
        </Card>

        <Card title="Claim Settlement">
          <Input label="Approved Amount" type="number" value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} placeholder="5000" />
          <div className="modal-actions">
            <Button onClick={handleInitiateSettlement} loading={loading}>Initiate Settlement</Button>
            <Button type="button" variant="secondary" onClick={handleFetchSettlement} loading={loading}>Fetch Settlement</Button>
          </div>

          {settlement && (
            <div style={{ marginTop: "1rem" }}>
              <p><strong>{settlement.settlementNumber}</strong> · {settlement.settlementStatus}</p>
              <p>Approved: {formatCurrency(settlement.approvedAmount)}</p>
              {settlement.paymentReference && <p>Payment Ref: {settlement.paymentReference}</p>}
              <Input label="Payment Reference" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="BANK-UTR-123" />
              <Button onClick={handleMarkPaid} loading={loading} disabled={settlement.settlementStatus === "PAID"}>Mark Paid</Button>
            </div>
          )}
        </Card>
      </div>

      <Card title="Latest Audit Logs">
        {auditLogs.length === 0 ? <EmptyState message="No audit logs yet." /> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Remarks</th></tr></thead>
              <tbody>
                {auditLogs.map((a) => (
                  <tr key={a.auditId}>
                    <td>{formatDateTime(a.createdAt)}</td>
                    <td>{a.actorEmail || "System"}</td>
                    <td>{a.action}</td>
                    <td>{a.entityType} #{a.entityId}</td>
                    <td>{a.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}