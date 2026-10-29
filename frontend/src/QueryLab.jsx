import { useState } from "react";
import { supabase } from "./supabase";
import "./QueryLab.css";

const queryGroups = [
{
name: "Basic Queries",
icon: "⌕",
queries: [
{
id: "menu",
title: "View All Food Items",
description: "Retrieve food items from the canteen menu.",
sql: "SELECT * FROM public.food_item ORDER BY item_id;",
type: "SELECT",
mode: "preview",
},
{
id: "available",
title: "Available Food Items",
description: "Filter menu items that are available.",
sql: "SELECT * FROM public.food_item WHERE is_available = TRUE;",
type: "FILTER",
mode: "preview",
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
type: "FUNCTION",
mode: "revenue",
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
description: "Inspect recorded database changes.",
sql: "SELECT * FROM public.audit_log ORDER BY audit_id DESC LIMIT 20;",
type: "AUDIT",
mode: "audit",
},
{
id: "trigger",
title: "Food Validation Trigger",
description: "Inspect the trigger that validates food items.",
sql: "SELECT trigger_name, event_manipulation, action_timing FROM information_schema.triggers WHERE event_object_schema = 'public' AND event_object_table = 'food_item';",
type: "TRIGGER",
mode: "preview",
},
],
},
{
name: "Functions & Procedures",
icon: "ƒ",
queries: [
{
id: "functions",
title: "Database Functions",
description: "Inspect the functions used by CampusDine.",
sql: "SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' ORDER BY p.proname;",
type: "FUNCTIONS",
mode: "preview",
},
],
},
];

export default function QueryLab() {
const [selected, setSelected] = useState(queryGroups[1].queries[0]);
const [search, setSearch] = useState("");
const [result, setResult] = useState([]);
const [columns, setColumns] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [message, setMessage] = useState("");
const [executed, setExecuted] = useState(false);

const allQueries = queryGroups.flatMap((group) => group.queries);

const filteredGroups = queryGroups
.map((group) => ({
...group,
queries: group.queries.filter((query) =>
query.title.toLowerCase().includes(search.toLowerCase())
),
}))
.filter((group) => group.queries.length > 0);

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
  let data;
  let queryError;

  if (selected.mode === "revenue") {
    const response = await supabase.rpc("get_canteen_revenue");
    data = response.data;
    queryError = response.error;
  } else if (selected.mode === "audit") {
    const response = await supabase
      .from("audit_log")
      .select("*")
      .order("audit_id", { ascending: false })
      .limit(20);

    data = response.data;
    queryError = response.error;
  } else {
    setMessage(
      "SQL preview only. This statement has not been executed. " +
      "Arbitrary SQL execution requires a secure backend endpoint."
    );
    setLoading(false);
    return;
  }

  if (queryError) {
    throw queryError;
  }

  const rows = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? [data]
      : [];

  setResult(rows);
  setColumns(rows.length ? Object.keys(rows[0]) : []);

  if (!rows.length) {
    setMessage("Query executed successfully. No rows returned.");
  } else {
    setMessage(`${rows.length} row(s) returned from Supabase.`);
  }
} catch (err) {
  setError(
    err?.message ||
    "Unable to execute the query. Check the database function, table and permissions."
  );
} finally {
  setLoading(false);
}


}

function copySQL() {
navigator.clipboard.writeText(selected.sql);
setMessage("SQL copied to clipboard.");
}

return ( <section className="query-lab"> <div className="ql-heading"> <div> <span className="ql-eyebrow">DATABASE MANAGEMENT</span> <h1>Query <span>Lab</span></h1> <p>
Explore database operations, analyse canteen data and inspect
database functions and triggers. </p> </div>


    <div className="ql-status">
      <span className="ql-status-dot" />
      PostgreSQL · Supabase
    </div>
  </div>

  <div className="ql-stats">
    <div className="ql-stat-card">
      <span>QUERY CATEGORIES</span>
      <strong>{queryGroups.length}</strong>
      <small>Database operation groups</small>
    </div>
    <div className="ql-stat-card">
      <span>AVAILABLE EXAMPLES</span>
      <strong>{allQueries.length}</strong>
      <small>SQL statements and functions</small>
    </div>
    <div className="ql-stat-card">
      <span>EXECUTION MODE</span>
      <strong>Controlled</strong>
      <small>Only supported operations execute</small>
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
              <small>{query.type}</small>
            </button>
          ))}
        </div>
      ))}
    </aside>

    <div className="ql-main">
      <div className="ql-query-header">
        <div>
          <span className="ql-query-type">{selected.type}</span>
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
          {selected.mode === "preview"
            ? "Preview mode"
            : "Supabase operation"}
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
            Executing database operation...
          </div>
        )}

        {!loading && error && (
          <div className="ql-error">
            <strong>Execution failed</strong>
            <p>{error}</p>
            <small>
              Verify the table/function name and Supabase permissions.
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
                  <tr key={row.audit_id ?? index}>
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

        {!loading && !error && executed &&
          selected.mode === "preview" && message && (
            <div className="ql-preview-notice">{message}</div>
          )}
      </div>

      <div className="ql-footer-note">
        <strong>Database safety:</strong> Query Lab only executes
        predefined, supported operations. SQL preview statements are
        not sent to the database.
      </div>
    </div>
  </div>
</section>


);
}
