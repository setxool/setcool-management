'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(n) || 0)

export default function Home() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('dashboard')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [jobs, setJobs] = useState([])
  const [receipts, setReceipts] = useState([])

  const [job, setJob] = useState({
    customer: '',
    phone: '',
    brand: '',
    type: '',
    pk: '',
    complaint: '',
    inspection: '',
    action: '',
    cost: ''
  })

  const [receipt, setReceipt] = useState({
    customer: '',
    phone: '',
    description: '',
    quantity: 1,
    price: '',
    paid: ''
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) loadData()
  }, [session])

  async function loadData() {
    const { data: jobData } = await supabase
      .from('ac_jobs')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: receiptData } = await supabase
      .from('receipts')
      .select('*')
      .order('created_at', { ascending: false })

    setJobs(jobData || [])
    setReceipts(receiptData || [])
  }

  async function login(e) {
    e.preventDefault()
    setLoginError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) setLoginError(error.message)
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  async function saveJob(e) {
    e.preventDefault()

    if (!job.customer) {
      alert('Nama pelanggan wajib diisi')
      return
    }

    let customerId = null

    const { data: customer } = await supabase
      .from('customers')
      .insert({
        name: job.customer,
        phone: job.phone
      })
      .select()
      .single()

    if (customer) customerId = customer.id

    const { error } = await supabase.from('ac_jobs').insert({
      customer_id: customerId,
      ac_brand: job.brand,
      ac_type: job.type,
      ac_pk: job.pk,
      complaint: job.complaint,
      inspection: job.inspection,
      action_taken: job.action,
      service_cost: Number(job.cost) || 0,
      total_cost: Number(job.cost) || 0,
      status: 'Selesai'
    })

    if (error) {
      alert(error.message)
      return
    }

    alert('Laporan AC berhasil disimpan')
    setJob({
      customer: '',
      phone: '',
      brand: '',
      type: '',
      pk: '',
      complaint: '',
      inspection: '',
      action: '',
      cost: ''
    })
    loadData()
  }

  async function saveReceipt(e) {
    e.preventDefault()

    if (!receipt.customer || !receipt.description) {
      alert('Pelanggan dan keterangan wajib diisi')
      return
    }

    const total =
      Number(receipt.quantity || 0) * Number(receipt.price || 0)

    const paid = Number(receipt.paid || 0)

    let customerId = null

    const { data: customer } = await supabase
      .from('customers')
      .insert({
        name: receipt.customer,
        phone: receipt.phone
      })
      .select()
      .single()

    if (customer) customerId = customer.id

    const { data: savedReceipt, error } = await supabase
      .from('receipts')
      .insert({
        customer_id: customerId,
        subtotal: total,
        total,
        paid,
        balance: total - paid,
        payment_method: 'Cash'
      })
      .select()
      .single()

    if (error) {
      alert(error.message)
      return
    }

    await supabase.from('receipt_items').insert({
      receipt_id: savedReceipt.id,
      description: receipt.description,
      quantity: Number(receipt.quantity || 1),
      price: Number(receipt.price || 0),
      amount: total
    })

    alert('Kuitansi berhasil disimpan')

    setReceipt({
      customer: '',
      phone: '',
      description: '',
      quantity: 1,
      price: '',
      paid: ''
    })

    loadData()
  }

  if (loading) {
    return <main className="container">Memuat SETCool...</main>
  }

  if (!session) {
    return (
      <main className="container login">
        <section className="card">
          <h1>SETCool Management</h1>
          <p>Login Admin</p>

          <form onSubmit={login}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {loginError && (
              <p className="error">{loginError}</p>
            )}

            <button type="submit">Login</button>
          </form>
        </section>
      </main>
    )
  }

  const totalIncome = receipts.reduce(
    (sum, r) => sum + Number(r.paid || 0),
    0
  )

  return (
    <main className="container">

      <header className="header">
        <div>
          <h1>SETCool Management</h1>
          <p>Service AC • Laporan • Kuitansi</p>
        </div>

        <button onClick={logout}>Logout</button>
      </header>

      <nav className="nav">
        <button onClick={() => setTab('dashboard')}>
          Dashboard
        </button>

        <button onClick={() => setTab('jobs')}>
          Laporan AC
        </button>

        <button onClick={() => setTab('receipts')}>
          Kuitansi
        </button>
      </nav>

      {tab === 'dashboard' && (
        <section>
          <h2>Dashboard</h2>

          <div className="cards">
            <div className="card">
              <small>Pendapatan</small>
              <strong>{rupiah(totalIncome)}</strong>
            </div>

            <div className="card">
              <small>Pekerjaan AC</small>
              <strong>{jobs.length}</strong>
            </div>

            <div className="card">
              <small>Kuitansi</small>
              <strong>{receipts.length}</strong>
            </div>
          </div>
        </section>
      )}

      {tab === 'jobs' && (
        <section>
          <h2>Laporan Pekerjaan AC</h2>

          <form onSubmit={saveJob} className="card form">

            <input
              placeholder="Nama pelanggan *"
              value={job.customer}
              onChange={(e) =>
                setJob({ ...job, customer: e.target.value })
              }
            />

            <input
              placeholder="No. WhatsApp"
              value={job.phone}
              onChange={(e) =>
                setJob({ ...job, phone: e.target.value })
              }
            />

            <input
              placeholder="Merk AC"
              value={job.brand}
              onChange={(e) =>
                setJob({ ...job, brand: e.target.value })
              }
            />

            <input
              placeholder="Jenis AC"
              value={job.type}
              onChange={(e) =>
                setJob({ ...job, type: e.target.value })
              }
            />

            <input
              placeholder="PK"
              value={job.pk}
              onChange={(e) =>
                setJob({ ...job, pk: e.target.value })
              }
            />

            <textarea
              placeholder="Keluhan pelanggan"
              value={job.complaint}
              onChange={(e) =>
                setJob({ ...job, complaint: e.target.value })
              }
            />

            <textarea
              placeholder="Hasil pemeriksaan"
              value={job.inspection}
              onChange={(e) =>
                setJob({ ...job, inspection: e.target.value })
              }
            />

            <textarea
              placeholder="Tindakan / pekerjaan"
              value={job.action}
              onChange={(e) =>
                setJob({ ...job, action: e.target.value })
              }
            />

            <input
              type="number"
              placeholder="Biaya service"
              value={job.cost}
              onChange={(e) =>
                setJob({ ...job, cost: e.target.value })
              }
            />

            <button type="submit">
              Simpan Laporan AC
            </button>
          </form>

          <h3>Riwayat Laporan</h3>

          {jobs.map((item) => (
            <div className="card" key={item.id}>
              <strong>{item.ac_brand || 'AC'}</strong>
              <p>{item.complaint}</p>
              <b>{rupiah(item.total_cost)}</b>
            </div>
          ))}
        </section>
      )}

      {tab === 'receipts' && (
        <section>
          <h2>Kuitansi</h2>

          <form onSubmit={saveReceipt} className="card form">

            <input
              placeholder="Nama pelanggan *"
              value={receipt.customer}
              onChange={(e) =>
                setReceipt({
                  ...receipt,
                  customer: e.target.value
                })
              }
            />

            <input
              placeholder="No. WhatsApp"
              value={receipt.phone}
              onChange={(e) =>
                setReceipt({
                  ...receipt,
                  phone: e.target.value
                })
              }
            />

            <input
              placeholder="Keterangan pembayaran *"
              value={receipt.description}
              onChange={(e) =>
                setReceipt({
                  ...receipt,
                  description: e.target.value
                })
              }
            />

            <input
              type="number"
              placeholder="Jumlah"
              value={receipt.quantity}
              onChange={(e) =>
                setReceipt({
                  ...receipt,
                  quantity: e.target.value
                })
              }
            />

            <input
              type="number"
              placeholder="Harga"
              value={receipt.price}
              onChange={(e) =>
                setReceipt({
                  ...receipt,
                  price: e.target.value
                })
              }
            />

            <input
              type="number"
              placeholder="Dibayar"
              value={receipt.paid}
              onChange={(e) =>
                setReceipt({
                  ...receipt,
                  paid: e.target.value
                })
              }
            />

            <button type="submit">
              Simpan Kuitansi
            </button>
          </form>

          <h3>Riwayat Kuitansi</h3>

          {receipts.map((item) => (
            <div className="card" key={item.id}>
              <strong>
                Kuitansi #{item.receipt_number}
              </strong>

              <p>Total: {rupiah(item.total)}</p>
              <p>Dibayar: {rupiah(item.paid)}</p>
              <p>Sisa: {rupiah(item.balance)}</p>
            </div>
          ))}
        </section>
      )}

      <footer>
        © {new Date().getFullYear()} SETCool Management
      </footer>

    </main>
  )
  }
