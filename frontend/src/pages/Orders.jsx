import { useEffect, useMemo, useState } from "react";
import { createOrder, deleteOrder, getOrder, getOrders } from "../api/orders";
import { getCustomers } from "../api/customers";
import { getProducts } from "../api/products";
import { extractError } from "../api/client";
import Modal from "../components/Modal.jsx";
import { useToast } from "../components/Toast.jsx";

const emptyLine = { product_id: "", quantity: 1 };

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState([{ ...emptyLine }]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState(null);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([getOrders(), getProducts(), getCustomers()])
      .then(([o, p, c]) => {
        setOrders(o);
        setProducts(p);
        setCustomers(c);
      })
      .catch((e) => toast.error(extractError(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const productMap = useMemo(
    () => Object.fromEntries(products.map((p) => [String(p.id), p])),
    [products]
  );

  const estimatedTotal = useMemo(() => {
    return lines.reduce((sum, l) => {
      const p = productMap[String(l.product_id)];
      if (!p) return sum;
      return sum + Number(p.price) * Number(l.quantity || 0);
    }, 0);
  }, [lines, productMap]);

  const openCreate = () => {
    setCustomerId("");
    setLines([{ ...emptyLine }]);
    setErrors({});
    setCreateOpen(true);
  };

  const updateLine = (idx, field, value) => {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };
  const addLine = () => setLines((ls) => [...ls, { ...emptyLine }]);
  const removeLine = (idx) =>
    setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, i) => i !== idx)));

  const validate = () => {
    const e = {};
    if (!customerId) e.customer = "Select a customer";
    const validLines = lines.filter((l) => l.product_id);
    if (validLines.length === 0) e.items = "Add at least one product";
    lines.forEach((l, i) => {
      if (l.product_id) {
        const p = productMap[String(l.product_id)];
        const qty = Number(l.quantity);
        if (!Number.isInteger(qty) || qty <= 0) {
          e[`line-${i}`] = "Quantity must be a positive whole number";
        } else if (p && qty > p.quantity) {
          e[`line-${i}`] = `Only ${p.quantity} in stock`;
        }
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      customer_id: Number(customerId),
      items: lines
        .filter((l) => l.product_id)
        .map((l) => ({
          product_id: Number(l.product_id),
          quantity: Number(l.quantity),
        })),
    };
    try {
      await createOrder(payload);
      toast.success("Order created");
      setCreateOpen(false);
      load();
    } catch (e) {
      toast.error(extractError(e));
    } finally {
      setSaving(false);
    }
  };

  const viewDetail = async (id) => {
    try {
      const data = await getOrder(id);
      setDetail(data);
    } catch (e) {
      toast.error(extractError(e));
    }
  };

  const remove = async (o) => {
    if (!window.confirm(`Cancel/delete order #${o.id}? Stock will be restored.`))
      return;
    try {
      await deleteOrder(o.id);
      toast.success("Order deleted");
      load();
    } catch (e) {
      toast.error(extractError(e));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Orders</h1>
        <button className="btn" onClick={openCreate}>
          + Create Order
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="empty">No orders yet. Create your first order.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>{o.customer_name || o.customer_id}</td>
                    <td>{o.items.length}</td>
                    <td>${Number(o.total_amount).toFixed(2)}</td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-row">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => viewDetail(o.id)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => remove(o)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {createOpen && (
        <Modal title="Create Order" onClose={() => setCreateOpen(false)}>
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Customer</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">Select a customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.email})
                  </option>
                ))}
              </select>
              {errors.customer && (
                <div className="field-error">{errors.customer}</div>
              )}
            </div>

            <label style={{ fontWeight: 600, fontSize: "0.85rem" }}>
              Line Items
            </label>
            {lines.map((l, idx) => (
              <div key={idx}>
                <div className="line-item">
                  <div>
                    <select
                      value={l.product_id}
                      onChange={(e) =>
                        updateLine(idx, "product_id", e.target.value)
                      }
                    >
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ${Number(p.price).toFixed(2)} ({p.quantity} in
                          stock)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={l.quantity}
                      onChange={(e) => updateLine(idx, "quantity", e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => removeLine(idx)}
                    title="Remove line"
                  >
                    &times;
                  </button>
                </div>
                {errors[`line-${idx}`] && (
                  <div className="field-error">{errors[`line-${idx}`]}</div>
                )}
              </div>
            ))}
            {errors.items && <div className="field-error">{errors.items}</div>}

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={addLine}
              style={{ marginTop: 6 }}
            >
              + Add line
            </button>

            <div className="order-total">
              Estimated Total: ${estimatedTotal.toFixed(2)}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn" disabled={saving}>
                {saving ? "Placing..." : "Place Order"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {detail && (
        <Modal title={`Order #${detail.id}`} onClose={() => setDetail(null)}>
          <p>
            <strong>Customer:</strong>{" "}
            {detail.customer_name || detail.customer_id}
          </p>
          <p>
            <strong>Date:</strong>{" "}
            {new Date(detail.created_at).toLocaleString()}
          </p>
          <p>
            <strong>Status:</strong> {detail.status}
          </p>
          <h4>Items</h4>
          <ul className="detail-list">
            {detail.items.map((it) => (
              <li key={it.id}>
                <span>
                  {it.product_name || `Product ${it.product_id}`} &times;{" "}
                  {it.quantity}
                </span>
                <span>${(Number(it.unit_price) * it.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="order-total">
            Total: ${Number(detail.total_amount).toFixed(2)}
          </div>
        </Modal>
      )}
    </div>
  );
}
