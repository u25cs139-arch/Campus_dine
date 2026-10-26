import { useEffect, useMemo, useState, useCallback } from 'react'
import './App.css'

const ADMIN_PIN = '1234'
const STATUSES = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled']
const inr = (n) => '₹' + Number(n).toFixed(2).replace(/\.00$/, '')

/* Sample menu. Ratings and prep times are placeholder demo values. */
const SEED_FOODS = [
  ['Masala Dosa', 'Breakfast', 50, 4.5, 10], ['Idli Sambar', 'Breakfast', 35, 4.3, 8], ['Poha', 'Breakfast', 25, 4.1, 6],
  ['Veg Thali', 'Meals', 80, 4.6, 15], ['Chole Bhature', 'Meals', 60, 4.4, 12],
  ['Paneer Roll', 'Snacks', 55, 4.2, 10], ['Veg Sandwich', 'Snacks', 40, 4.0, 8], ['Samosa', 'Snacks', 15, 4.3, 4],
  ['Masala Chai', 'Beverages', 12, 4.7, 3], ['Cold Coffee', 'Beverages', 40, 4.4, 5], ['Fresh Lime Soda', 'Beverages', 25, 4.1, 4],
].map(([name, category, price, rating, mins], i) => ({
  item_id: i + 1, name, category, price, rating, mins, veg: true, is_available: true,
}))

/* Photos: put files in public/images/ named after the dish, e.g. masala-dosa.jpg.
   A "Photo URL" set in the admin panel takes priority. If no photo is found, a plain tile is shown. */
const fileSlug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const imgFor = (f) => f.image || '/images/' + fileSlug(f.name) + '.jpg'
const slug = (s) => 'c-' + s.toLowerCase().replace(/[^a-z0-9]+/g, '-')

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
  </svg>
)
const BagIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8a3 3 0 0 1 6 0" />
  </svg>
)
const StarIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5L9 8.9z" />
  </svg>
)

/* Everything lives in the browser (localStorage). No backend needed. */
function usePersisted(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : initial
    } catch { return initial }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* storage unavailable */ }
  }, [key, val])
  return [val, setVal]
}

export default function App() {
  const [view, setView] = useState('menu')
  const [foods, setFoods] = usePersisted('cd_foods_v2', SEED_FOODS)
  const [orders, setOrders] = usePersisted('cd_orders', [])
  const [customer, setCustomer] = usePersisted('cd_customer', null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [cart, setCart] = useState({})
  const [q, setQ] = useState('')
  const [toast, setToast] = useState(null)

  const notify = useCallback((msg, err = false) => {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const cartLines = foods.filter((f) => cart[f.item_id])
  const cartCount = cartLines.reduce((s, f) => s + cart[f.item_id], 0)
  const cartTotal = cartLines.reduce((s, f) => s + f.price * cart[f.item_id], 0)

  const goTray = () => {
    setView('menu')
    setTimeout(() => document.getElementById('tray')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }
  const logout = () => { setCustomer(null); setCart({}); setIsAdmin(false); setView('menu') }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-in">
          <div className="brand">Campus<span>Dine</span></div>
          <label className="search">
            <SearchIcon />
            <input type="search" placeholder="Search for dosa, chai, thali…" value={q}
              aria-label="Search the menu"
              onChange={(e) => { setQ(e.target.value); setView('menu') }} />
          </label>
          <nav className="nav">
            <button className={view === 'menu' ? 'on' : ''} onClick={() => setView('menu')}>Menu</button>
            <button className={view === 'orders' ? 'on' : ''} onClick={() => setView('orders')}>My orders</button>
            <button className={view === 'admin' ? 'on' : ''} onClick={() => setView('admin')}>Canteen admin</button>
          </nav>
          <div className="top-right">
            {customer && (
              <div className="who">
                <span>{customer.name} ({customer.role})</span>
                <button className="btn ghost small" onClick={logout}>Switch user</button>
              </div>
            )}
            <button className="cart-btn" onClick={goTray}>
              <BagIcon />
              {cartCount ? cartCount + ' · ' + inr(cartTotal) : 'Tray'}
            </button>
          </div>
        </div>
      </header>

      <main className="shell">
        {view === 'menu' && (
          <Menu foods={foods} cart={cart} setCart={setCart} customer={customer} q={q} setQ={setQ}
            setOrders={setOrders} notify={notify} goOrders={() => setView('orders')} />
        )}
        {view === 'orders' && <MyOrders customer={customer} orders={orders} setOrders={setOrders} />}
        {view === 'admin' && (isAdmin
          ? <Admin foods={foods} setFoods={setFoods} orders={orders} setOrders={setOrders} notify={notify} />
          : <PinGate onOk={() => setIsAdmin(true)} notify={notify} />)}
      </main>

      {view === 'menu' && cartCount > 0 && (
        <button className="mobile-cart" onClick={goTray}>
          <span>{cartCount} item{cartCount > 1 ? 's' : ''}</span><span>View tray · {inr(cartTotal)}</span>
        </button>
      )}
      {!customer && view !== 'admin' && <Register onDone={setCustomer} notify={notify} />}
      {toast && <div className={'toast' + (toast.err ? ' err' : '')} role="status">{toast.msg}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
function Register({ onDone, notify }) {
  const [f, setF] = useState({ name: '', email: '', phone: '', role: 'Student' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    const c = {
      customer_id: f.email.trim().toLowerCase(),
      name: f.name.trim(), email: f.email.trim().toLowerCase(),
      phone: f.phone.trim(), role: f.role,
    }
    onDone(c)
    notify('Welcome, ' + c.name)
  }

  return (
    <div className="overlay">
      <form className="modal" onSubmit={submit}>
        <h2>Who's ordering?</h2>
        <p>Enter your details to start ordering.</p>
        <div className="field"><label>Full name</label><input required value={f.name} onChange={set('name')} /></div>
        <div className="field"><label>Email</label><input required type="email" value={f.email} onChange={set('email')} /></div>
        <div className="field"><label>Phone (optional)</label><input value={f.phone} onChange={set('phone')} /></div>
        <div className="field">
          <label>I am a</label>
          <select value={f.role} onChange={set('role')}>
            <option>Student</option><option>Faculty</option><option>Staff</option>
          </select>
        </div>
        <button className="btn" style={{ width: '100%' }}>Start ordering</button>
      </form>
    </div>
  )
}

/* ------------------------------------------------------------------ */
function Thumb({ item, text }) {
  const [bad, setBad] = useState(false)
  return item && !bad
    ? <img src={imgFor(item)} alt="" onError={() => setBad(true)} />
    : <span>{text}</span>
}

function Dish({ f, qty, change }) {
  const [broken, setBroken] = useState(false)
  return (
    <article className={'dish ' + slug(f.category) + (f.is_available ? '' : ' off')}>
      <div className="dish-media">
        <div className="dish-img">
          {!broken
            ? <img src={imgFor(f)} alt={f.name} loading="lazy" onError={() => setBroken(true)} />
            : <div className="plate"><strong>{f.name}</strong></div>}
        </div>
        <div className="dish-act">
          {!f.is_available ? <span className="soldout">Sold out</span>
            : qty ? (
              <span className="stepper">
                <button aria-label={'Remove one ' + f.name} onClick={() => change(f.item_id, -1)}>−</button>
                <span>{qty}</span>
                <button aria-label={'Add one ' + f.name} onClick={() => change(f.item_id, 1)}>+</button>
              </span>
            ) : <button className="add-btn" onClick={() => change(f.item_id, 1)}>ADD</button>}
        </div>
      </div>
      <div className="dish-body">
        <div className="dish-title">
          <span className={'vegmark' + (f.veg === false ? ' nv' : '')} title={f.veg === false ? 'Non-veg' : 'Veg'}></span>
          <h3>{f.name}</h3>
        </div>
        <div className="dish-meta">
          {f.rating ? <span className="rate"><StarIcon /> {f.rating}</span> : null}
          {f.mins ? <span>{f.mins} mins</span> : null}
          <span>{f.category}</span>
        </div>
        <div className="dish-price">{inr(f.price)}</div>
      </div>
    </article>
  )
}

function Menu({ foods, cart, setCart, customer, q, setQ, setOrders, notify, goOrders }) {
  const [cat, setCat] = useState('All')
  const [method, setMethod] = useState('UPI')
  const [vegOnly, setVegOnly] = useState(false)
  const [under50, setUnder50] = useState(false)
  const [sort, setSort] = useState('default')

  const cats = useMemo(() => [...new Set(foods.map((f) => f.category))], [foods])
  const term = q.trim().toLowerCase()
  const visible = foods.filter((f) =>
    (cat === 'All' || f.category === cat) &&
    (!vegOnly || f.veg !== false) &&
    (!under50 || f.price <= 50) &&
    (!term || f.name.toLowerCase().includes(term) || f.category.toLowerCase().includes(term)))
  const ordered = (arr) => {
    if (sort === 'low') return [...arr].sort((a, b) => a.price - b.price)
    if (sort === 'high') return [...arr].sort((a, b) => b.price - a.price)
    if (sort === 'rating') return [...arr].sort((a, b) => (b.rating || 0) - (a.rating || 0))
    return arr
  }
  const groups = [...new Set(visible.map((f) => f.category))]
  const lines = foods.filter((f) => cart[f.item_id])
  const total = lines.reduce((s, f) => s + f.price * cart[f.item_id], 0)
  const clearFilters = () => { setCat('All'); setVegOnly(false); setUnder50(false); setSort('default'); setQ('') }

  const change = (id, d) => setCart((c) => {
    const n = (c[id] || 0) + d
    const next = { ...c }
    if (n <= 0) delete next[id]; else next[id] = n
    return next
  })

  const place = () => {
    if (!customer) return notify('Please register first', true)
    const paidNow = method !== 'Cash'
    setOrders((prev) => {
      const newId = prev.reduce((m, o) => Math.max(m, o.order_id), 0) + 1
      const order = {
        order_id: newId,
        customer,
        order_time: new Date().toISOString(),
        status: 'Pending',
        total_amount: total,
        items: lines.map((f) => ({ name: f.name, quantity: cart[f.item_id], unit_price: f.price })),
        payment: { method, amount: total, status: paidNow ? 'Paid' : 'Pending' },
      }
      return [order, ...prev]
    })
    setCart({})
    notify('Order placed')
    goOrders()
  }

  return (
    <>
      <section className="promos" aria-label="Featured categories">
        {cats.slice(0, 3).map((c, i) => {
          const items = foods.filter((f) => f.category === c)
          const from = Math.min(...items.map((f) => f.price))
          return (
            <button key={c} className={'promo p' + i} onClick={() => setCat(c)}>
              <div className="promo-text">
                <span className="promo-chip">{items.length} item{items.length > 1 ? 's' : ''}</span>
                <h2>{c}</h2>
                <small>Starting at {inr(from)}</small>
                <span className="promo-cta">
                  Order now
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="12" fill="currentColor" opacity=".9" />
                    <path d="M8 12h8m-3-3.5 3.5 3.5-3.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
              <div className="promo-art" aria-hidden="true"><Thumb item={items[0]} text={c[0]} /></div>
            </button>
          )
        })}
      </section>

      <div className="split">
        <div>
          <h2 className="sec-title">What's on your mind?</h2>
          <div className="bubbles">
            {['All', ...cats].map((c) => (
              <button key={c} className={'bubble ' + slug(c) + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>
                <span className="bubble-art" aria-hidden="true">
                  <Thumb item={c === 'All' ? null : foods.find((f) => f.category === c)} text={c === 'All' ? 'All' : c[0]} />
                </span>
                {c}
              </button>
            ))}
          </div>

          <div className="filters">
            <button className={'fchip' + (vegOnly ? ' on' : '')} onClick={() => setVegOnly(!vegOnly)}>Pure veg</button>
            <button className={'fchip' + (under50 ? ' on' : '')} onClick={() => setUnder50(!under50)}>Under ₹50</button>
            <select className="sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort dishes">
              <option value="default">Sort: Relevance</option>
              <option value="rating">Rating: High to low</option>
              <option value="low">Price: Low to high</option>
              <option value="high">Price: High to low</option>
            </select>
          </div>

          {foods.length === 0 && <p className="empty">No items yet. Ask the canteen admin to add some.</p>}
          {foods.length > 0 && visible.length === 0 && (
            <p className="empty">No dishes match your filters. <button className="btn ghost small" onClick={clearFilters}>Clear filters</button></p>
          )}

          {groups.map((g) => {
            const items = ordered(visible.filter((f) => f.category === g))
            return (
              <section key={g}>
                <h2 className="sec-title">{g} <small>{items.length} item{items.length > 1 ? 's' : ''}</small></h2>
                <div className="dish-grid">
                  {items.map((f) => <Dish key={f.item_id} f={f} qty={cart[f.item_id] || 0} change={change} />)}
                </div>
              </section>
            )
          })}
        </div>

        <aside className="panel" id="tray">
          <h2>Your tray</h2>
          {lines.length === 0 && <p className="empty">Nothing added yet. Tap ADD on any dish.</p>}
          {lines.map((f) => (
            <div className="cart-line" key={f.item_id}>
              <span>{cart[f.item_id]} × {f.name}</span>
              <span>{inr(f.price * cart[f.item_id])}</span>
            </div>
          ))}
          <div className="cart-total"><span>To pay</span><span>{inr(total)}</span></div>
          <div className="field">
            <label>Payment method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="UPI">UPI</option><option value="Card">Card</option><option value="Cash">Cash at counter</option>
            </select>
          </div>
          <button className="btn" style={{ width: '100%' }} disabled={!lines.length} onClick={place}>
            Place order
          </button>
        </aside>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
function MyOrders({ customer, orders, setOrders }) {
  const mine = orders.filter((o) => customer && o.customer.customer_id === customer.customer_id)

  const cancel = (id) => setOrders((prev) =>
    prev.map((o) => (o.order_id === id && o.status === 'Pending' ? { ...o, status: 'Cancelled' } : o)))

  return (
    <>
      <h1 className="page-title">My orders</h1>
      <p className="lede">Status changes as soon as the canteen updates your order.</p>
      {mine.length === 0 && <p className="empty">You haven't placed any orders yet.</p>}
      <div className="orders-grid">
        {mine.map((o) => (
          <div className="order-card" key={o.order_id}>
            <div className="order-head">
              <strong>Order #{o.order_id}</strong>
              <span>{new Date(o.order_time).toLocaleString()}</span>
            </div>
            <div>{o.items.map((d) => d.quantity + ' × ' + d.name).join(', ')}</div>
            <div className="order-head" style={{ marginTop: 12, marginBottom: 0 }}>
              <span>
                <span className={'badge ' + o.status}>{o.status}</span>{' '}
                <span className={'badge ' + o.payment.status}>{o.payment.method}: {o.payment.status}</span>
              </span>
              <span>
                <strong>{inr(o.total_amount)}</strong>{' '}
                {o.status === 'Pending' && <button className="btn ghost small" onClick={() => cancel(o.order_id)}>Cancel</button>}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
function PinGate({ onOk, notify }) {
  const [pin, setPin] = useState('')
  return (
    <div style={{ maxWidth: 360 }}>
      <h1 className="page-title">Canteen admin</h1>
      <p className="lede">Enter the admin PIN (demo PIN: {ADMIN_PIN}) to manage the menu, orders and payments.</p>
      <form onSubmit={(e) => { e.preventDefault(); pin === ADMIN_PIN ? onOk() : notify('Wrong PIN', true) }}>
        <div className="field"><label>Admin PIN</label>
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} /></div>
        <button className="btn">Open admin</button>
      </form>
    </div>
  )
}

/* ------------------------------------------------------------------ */
function Admin({ foods, setFoods, orders, setOrders, notify }) {
  const [nf, setNf] = useState({ name: '', category: '', price: '', image: '', type: 'veg' })

  const paidRevenue = orders.reduce(
    (s, o) => s + (o.payment.status === 'Paid' && o.status !== 'Cancelled' ? o.payment.amount : 0), 0)
  const active = orders.filter((o) => ['Pending', 'Preparing', 'Ready'].includes(o.status)).length
  const unpaid = orders.filter((o) => o.payment.status === 'Pending' && o.status !== 'Cancelled').length

  const addItem = (e) => {
    e.preventDefault()
    const name = nf.name.trim()
    if (foods.some((f) => f.name.toLowerCase() === name.toLowerCase())) return notify('That item already exists', true)
    setFoods((prev) => [...prev, {
      item_id: prev.reduce((m, f) => Math.max(m, f.item_id), 0) + 1,
      name, category: nf.category.trim(), price: Number(nf.price),
      image: nf.image.trim() || undefined, veg: nf.type === 'veg', is_available: true,
    }])
    setNf({ name: '', category: '', price: '', image: '', type: 'veg' })
    notify('Item added')
  }
  const updateItem = (id, patch) => setFoods((prev) => prev.map((f) => (f.item_id === id ? { ...f, ...patch } : f)))
  const deleteItem = (id) => setFoods((prev) => prev.filter((f) => f.item_id !== id))
  const setStatus = (id, status) => setOrders((prev) => prev.map((o) => (o.order_id === id ? { ...o, status } : o)))
  const markPaid = (id) => setOrders((prev) =>
    prev.map((o) => (o.order_id === id ? { ...o, payment: { ...o.payment, status: 'Paid' } } : o)))
  const resetAll = () => {
    if (!window.confirm('Delete all orders and restore the default menu?')) return
    setOrders([]); setFoods(SEED_FOODS)
  }

  return (
    <>
      <h1 className="page-title">Canteen admin</h1>
      <div className="stats">
        <div className="stat"><b>{inr(paidRevenue)}</b><small>Paid revenue</small></div>
        <div className="stat"><b>{active}</b><small>Orders in progress</small></div>
        <div className="stat"><b>{unpaid}</b><small>Payments pending</small></div>
        <div className="stat"><b>{orders.length}</b><small>Total orders</small></div>
      </div>

      <h2>Orders</h2>
      <div className="table-wrap" style={{ marginTop: 10 }}>
        <table>
          <thead><tr><th>#</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan="6" className="empty">No orders yet.</td></tr>}
            {orders.map((o) => (
              <tr key={o.order_id}>
                <td>{o.order_id}</td>
                <td>{o.customer.name}<br /><small>{o.customer.role}</small></td>
                <td>{o.items.map((d) => d.quantity + ' × ' + d.name).join(', ')}</td>
                <td>{inr(o.total_amount)}</td>
                <td>
                  <span className={'badge ' + o.payment.status}>{o.payment.method}: {o.payment.status}</span>{' '}
                  {o.payment.status === 'Pending' && <button className="btn small" onClick={() => markPaid(o.order_id)}>Mark paid</button>}
                </td>
                <td>
                  <select value={o.status} onChange={(e) => setStatus(o.order_id, e.target.value)}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="section-gap">Menu items</h2>
      <form className="row" style={{ margin: '10px 0 16px' }} onSubmit={addItem}>
        <div className="field"><label>Name</label><input required value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} /></div>
        <div className="field"><label>Category</label><input required value={nf.category} onChange={(e) => setNf({ ...nf, category: e.target.value })} /></div>
        <div className="field"><label>Price (₹)</label><input required type="number" min="1" step="0.5" value={nf.price} onChange={(e) => setNf({ ...nf, price: e.target.value })} /></div>
        <div className="field"><label>Photo URL (optional)</label><input value={nf.image} onChange={(e) => setNf({ ...nf, image: e.target.value })} /></div>
        <div className="field"><label>Type</label>
          <select value={nf.type} onChange={(e) => setNf({ ...nf, type: e.target.value })}>
            <option value="veg">Veg</option><option value="nonveg">Non-veg</option>
          </select></div>
        <button className="btn">Add item</button>
      </form>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Photo URL</th><th>Available</th><th></th></tr></thead>
          <tbody>
            {foods.map((f) => (
              <tr key={f.item_id}>
                <td>{f.name}</td>
                <td>{f.category}</td>
                <td>
                  <input className="inline-input" type="number" min="1" step="0.5" defaultValue={f.price}
                    onBlur={(e) => Number(e.target.value) > 0 && Number(e.target.value) !== f.price && updateItem(f.item_id, { price: Number(e.target.value) })} />
                </td>
                <td>
                  <input className="inline-input wide" placeholder="https://…" defaultValue={f.image || ''}
                    onBlur={(e) => e.target.value.trim() !== (f.image || '') && updateItem(f.item_id, { image: e.target.value.trim() || undefined })} />
                </td>
                <td>
                  <button className={'btn small' + (f.is_available ? '' : ' ghost')}
                    onClick={() => updateItem(f.item_id, { is_available: !f.is_available })}>
                    {f.is_available ? 'Available' : 'Sold out'}
                  </button>
                </td>
                <td><button className="btn danger small" onClick={() => deleteItem(f.item_id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 24 }}>
        <button className="btn ghost small" onClick={resetAll}>Reset demo data</button>
      </p>
    </>
  )
}