
import { useState } from "react";
import "./QueryLab.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const QUERY_GROUPS = [
  {
    name: "Basic Queries",
    icon: "⌕",
    queries: [
      {
        id: "menu",
        title: "View All Food Items",
        description: "Retrieve food items from the canteen menu.",
        sql: "SELECT * FROM public.food_item ORDER BY item_id;",
        endpoint: "/api/query-lab/menu",
      },
      {
        id: "available",
        title: "Available Food Items",
        description: "Filter menu items that are available.",
        sql: "SELECT * FROM public.food_item WHERE is_available = TRUE;",
        endpoint: "/api/query-lab/available-food",
      },
      {
        id: "categories",
        title: "View Categories",
        description: "Retrieve all food categories.",
        sql: "SELECT * FROM public.category ORDER BY category_name;",
        endpoint: "/api/query-lab/categories",
      },
    ],
  },
  {
    name: "Aggregate Queries",
    icon: "∑",
    queries: [
      {
        id: "revenue",
        title: "Canteen Revenue",
        description: "Calculate total orders, order value and paid revenue.",
        sql: "SELECT * FROM public.get_canteen_revenue();",
        endpoint: "/api/query-lab/revenue",
      },
      {
        id: "category-count",
        title: "Food Items by Category",
        description: "Count the food items in each category.",
        sql: "SELECT category_id, COUNT(*) AS item_count FROM public.food_item GROUP BY category_id ORDER BY category_id;",
        endpoint: "/api/query-lab/category-count",
      },
    ],
  },
  {
    name: "Orders",
    icon: "▤",
    queries: [
      {
        id: "orders",
        title: "View Orders",
        description: "Retrieve recent orders.",
        sql: "SELECT * FROM public.orders ORDER BY order_time DESC;",
        endpoint: "/api/query-lab/orders",
      },
      {
        id: "order-details",
        title: "Order Details",
        description: "Retrieve order line items.",
        sql: "SELECT * FROM public.order_detail ORDER BY order_id;",
        endpoint: "/api/query-lab/order-details",
      },
    ],
  },
  {
    name: "Triggers & Auditing",
    icon: "⚡",
    queries: [
      {
        id: "audit",
        title: "Recent Audit Logs",
        description: "Inspect recorded food-item changes.",
        sql: "SELECT * FROM public.audit_log ORDER BY audit_id DESC LIMIT 20;",
        endpoint: "/api/query-lab/audit-logs",
      },
      {
        id: "triggers",
        title: "Database Triggers",
        description: "Inspect triggers installed on public tables.",
        sql: "SELECT trigger_name, event_object_table, event_manipulation, action_timing FROM information_schema.triggers WHERE event_object_schema = 'public';",
        endpoint: "/api/query-lab/triggers",
      },
    ],
  },
];

export default function QueryLab() {
  const [selected, setSelected] = useState(QUERY_GROUPS[1].queries[0]);
  const [search, setSearch] = useState("");
  const [result, setResult] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [executed, setExecuted] = useState(false);

  const filteredGroups = QUERY_GROUPS.map((group) => ({
    ...group,
    queries: group.queries.filter((query) =>
      query.title.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((group) => group.queries.length > 0);

  function chooseQuery(query) {
    setSelected(query);
    setResult([]);
    setColumns([]);
    setError("");
    setMessage("");
    setExecuted(false);
  }

  async function executeQuery() {
    setLoading(true);
    setError("");
    setMessage("");
    setResult([]);
    setColumns([]);
    setExecuted(true);

    try {
      const response = await fetch(`${API_URL}${selected.endpoint}`);

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.error || `Request failed with status ${response.status}`
        );
      }

      const rows = Array.isArray(payload.data)
        ? payload.data
        : payload.data && typeof payload.data === "object"
          ? [payload.data]
          : [];

      setResult(rows);
      setColumns(rows.length ? Object.keys(rows[0]) : []);
      setMessage(
        rows.length
          ? `${rows.length} row(s) returned successfully.`
          : "Request completed successfully. No rows returned."
      );
    } catch (err) {
      setError(
        err.message ||
          "Could not connect to the backend. Check whether the server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copySQL() {
    try {
      await navigator.clipboard.writeText(selected.sql);
      setMessage("SQL copied to clipboard.");
    } catch {
      setMessage("Clipboard access is unavailable in this browser.");
    }
  }

  return (
    <section className="query-lab">
      <div className="ql-heading">
        <div>
          <span className="ql-eyebrow">DATABASE MANAGEMENT</span>
          <h1>
            Query <span>Lab</span>
          </h1>
          <p>
            Explore CampusDine data, run predefined database queries and
            inspect results from your PostgreSQL database.
          </p>
        </div>

        <div className="ql-status">
          <span className="ql-status-dot" />
          PostgreSQL · Supabase
        </div>
      </div>

      <div className="ql-stats">
        <div className="ql-stat-card">
          <span>QUERY CATEGORIES</span>
          <strong>{QUERY_GROUPS.length}</strong>
          <small>Database operation groups</small>
        </div>

        <div className="ql-stat-card">
          <span>AVAILABLE QUERIES</span>
          <strong>
            {QUERY_GROUPS.reduce(
              (count, group) => count + group.queries.length,
              0
            )}
          </strong>
          <small>Predefined database operations</small>
        </div>

        <div className="ql-stat-card">
          <span>DATABASE</span>
          <strong>Connected API</strong>
          <small>Requests run through the backend</small>
        </div>
      </div>

      <div className="ql-workspace">
        <aside className="ql-sidebar">
          <div className="ql-sidebar-heading">QUERY EXPLORER</div>

          <input
            className="ql-search"
            placeholder="Search queries..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {filteredGroups.map((group) => (
            <div className="ql-group" key={group.name}>
              <div className="ql-group-title">
                <span>{group.icon}</span>
                {group.name}
              </div>

              {group.queries.map((query) => (
                <button
                  key={query.id}
                  className={
                    selected.id === query.id
                      ? "ql-query-item active"
                      : "ql-query-item"
                  }
                  onClick={() => chooseQuery(query)}
                >
                  <span>{query.title}</span>
                  <small>{query.id.toUpperCase()}</small>
                </button>
              ))}
            </div>
          ))}
        </aside>

        <div className="ql-main">
          <div className="ql-query-header">
            <div>
              <span className="ql-query-type">
                {selected.id.toUpperCase()}
              </span>
              <h2>{selected.title}</h2>
              <p>{selected.description}</p>
            </div>
          </div>

          <div className="ql-editor-heading">
            <span>SQL STATEMENT</span>
            <button className="ql-copy-btn" onClick={copySQL}>
              Copy SQL
            </button>
          </div>

          <pre className="ql-code">
            <code>{selected.sql}</code>
          </pre>

          <div className="ql-actions">
            <button
              className="ql-run-btn"
              onClick={executeQuery}
              disabled={loading}
            >
              {loading ? "Executing..." : "▶ Execute Query"}
            </button>

            <span className="ql-execution-note">
              Runs through the backend API
            </span>
          </div>

          <div className="ql-results">
            <div className="ql-results-heading">
              <div>
                <span className="ql-results-label">OUTPUT</span>
                <h3>Query Results</h3>
              </div>

              {result.length > 0 && (
                <span className="ql-row-count">
                  {result.length} rows
                </span>
              )}
            </div>

            {loading && (
              <div className="ql-empty">
                Fetching results from the database...
              </div>
            )}

            {!loading && error && (
              <div className="ql-error">
                <strong>Execution failed</strong>
                <p>{error}</p>
                <small>
                  Check the backend server, API route and Supabase permissions.
                </small>
              </div>
            )}

            {!loading && !error && result.length > 0 && (
              <div className="ql-table-wrap">
                <table className="ql-table">
                  <thead>
                    <tr>
                      {columns.map((column) => (
                        <th key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {result.map((row, index) => (
                      <tr key={row.audit_id ?? row.order_id ?? index}>
                        {columns.map((column) => (
                          <td key={column}>
                            {row[column] === null
                              ? "NULL"
                              : typeof row[column] === "object"
                                ? JSON.stringify(row[column])
                                : String(row[column])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && !error && result.length === 0 && (
              <div className="ql-empty">
                {message || "Select a query and click Execute Query."}
              </div>
            )}

            {!loading && !error && result.length > 0 && message && (
              <div className="ql-success">{message}</div>
            )}
          </div>

          <div className="ql-footer-note">
            <strong>Database safety:</strong> The interface calls predefined
            backend endpoints. The SQL displayed here documents the intended
            operation; actual execution is implemented by the backend route.
            Do not expose your Supabase service-role key in frontend code.
          </div>
        </div>
      </div>
    </section>
  );
}

