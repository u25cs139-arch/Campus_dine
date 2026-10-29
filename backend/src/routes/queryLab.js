const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

// Helper: return errors consistently
function handleError(res, error) {
  console.error("Query Lab error:", error);

  return res.status(500).json({
    success: false,
    error: error.message || "Database query failed",
  });
}

// 1. View all food items
router.get("/menu", async (req, res) => {
  const { data, error } = await supabase
    .from("food_item")
    .select("*")
    .order("item_id", { ascending: true });

  if (error) return handleError(res, error);

  res.json({ success: true, data });
});

// 2. View available food items
router.get("/available-food", async (req, res) => {
  const { data, error } = await supabase
    .from("food_item")
    .select("*")
    .eq("is_available", true)
    .order("item_id", { ascending: true });

  if (error) return handleError(res, error);

  res.json({ success: true, data });
});

// 3. View categories
router.get("/categories", async (req, res) => {
  const { data, error } = await supabase
    .from("category")
    .select("*")
    .order("category_id", { ascending: true });

  if (error) return handleError(res, error);

  res.json({ success: true, data });
});

// 4. Canteen revenue function
router.get("/revenue", async (req, res) => {
  const { data, error } = await supabase.rpc("get_canteen_revenue");

  if (error) return handleError(res, error);

  // RPC may return either an object or an array.
  const rows = Array.isArray(data) ? data : data ? [data] : [];

  res.json({ success: true, data: rows });
});

// 5. Count food items by category
router.get("/category-count", async (req, res) => {
  const { data, error } = await supabase
    .from("food_item")
    .select("category_id");

  if (error) return handleError(res, error);

  const counts = {};

  for (const item of data || []) {
    const key =
      item.category_id === null ? "Uncategorized" : String(item.category_id);

    counts[key] = (counts[key] || 0) + 1;
  }

  const rows = Object.entries(counts).map(([category_id, item_count]) => ({
    category_id,
    item_count,
  }));

  res.json({ success: true, data: rows });
});

// 6. View recent orders
router.get("/orders", async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("order_id", { ascending: false })
    .limit(100);

  if (error) return handleError(res, error);

  res.json({ success: true, data });
});

// 7. View order details
router.get("/order-details", async (req, res) => {
  const { data, error } = await supabase
    .from("order_detail")
    .select("*")
    .order("order_id", { ascending: true })
    .limit(200);

  if (error) return handleError(res, error);

  res.json({ success: true, data });
});

// 8. View recent audit logs
router.get("/audit-logs", async (req, res) => {
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("audit_id", { ascending: false })
    .limit(20);

  if (error) return handleError(res, error);

  res.json({ success: true, data });
});

// 9. Inspect database triggers
router.get("/triggers", async (req, res) => {
  const { data, error } = await supabase.rpc("get_public_triggers");

  if (error) {
    return res.status(500).json({
      success: false,
      error:
        "Could not retrieve triggers. Create the get_public_triggers() SQL function first.",
    });
  }

  res.json({
    success: true,
    data: Array.isArray(data) ? data : data ? [data] : [],
  });
});

module.exports = router;