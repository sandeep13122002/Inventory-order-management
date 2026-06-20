import { useEffect, useState } from "react";
import { getDashboardSummary } from "../api/dashboard";
import { extractError } from "../api/client";
import { useToast } from "../components/Toast.jsx";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch((e) => toast.error(extractError(e)))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!summary) return <div className="empty">Could not load dashboard data.</div>;

  const cards = [
    { label: "Total Products", value: summary.total_products },
    { label: "Total Customers", value: summary.total_customers },
    { label: "Total Orders", value: summary.total_orders },
    { label: "Low Stock Products", value: summary.low_stock_count, warn: true },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="stat-grid">
        {cards.map((c) => (
          <div key={c.label} className={`card stat-card ${c.warn ? "warn" : ""}`}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Low Stock Products</h3>
        {summary.low_stock_products.length === 0 ? (
          <p className="muted">All products are above the low-stock threshold.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {summary.low_stock_products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.sku}</td>
                    <td>
                      <span className="badge badge-low">{p.quantity} left</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
