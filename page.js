'use client';
import {useEffect,useState} from 'react';

const rupiah=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0);

export default function Home(){
 const [tab,setTab]=useState('dashboard');
 const [receipts,setReceipts]=useState([]);
 const [jobs,setJobs]=useState([]);
 const [form,setForm]=useState({customer:'',service:'',amount:'',paid:'',phone:''});
 useEffect(()=>{setReceipts(JSON.parse(localStorage.getItem('receipts')||'[]'));setJobs(JSON.parse(localStorage.getItem('jobs')||'[]'))},[]);
 const saveReceipt=()=>{if(!form.customer||!form.amount)return alert('Isi pelanggan dan nominal');const r={...form,id:Date.now(),no:'KWT-'+String(receipts.length+1).padStart(4,'0'),date:new Date().toLocaleDateString('id-ID')};const x=[r,...receipts];setReceipts(x);localStorage.setItem('receipts',JSON.stringify(x));setForm({customer:'',service:'',amount:'',paid:'',phone:''});setTab('receipts')};
 const saveJob=()=>{if(!form.customer||!form.service)return alert('Isi pelanggan dan pekerjaan');const j={id:Date.now(),customer:form.customer,service:form.service,date:new Date().toLocaleDateString('id-ID')};const x=[j,...jobs];setJobs(x);localStorage.setItem('jobs',JSON.stringify(x));setForm({...form,customer:'',service:''});setTab('jobs')};
 const total=receipts.reduce((a,r)=>a+Number(r.amount||0),0);
 return <main>
  <header><div><b>SETCool</b><span> Management</span></div><small>Service AC • Laporan • Kuitansi</small></header>
  <nav>{[['dashboard','Dashboard'],['jobs','Laporan AC'],['receipts','Kuitansi']].map(([k,v])=><button className={tab===k?'active':''} onClick={()=>setTab(k)} key={k}>{v}</button>)}</nav>
  {tab==='dashboard'&&<section><h1>Dashboard</h1><div className="cards"><article><small>Pendapatan</small><strong>{rupiah(total)}</strong></article><article><small>Pekerjaan</small><strong>{jobs.length}</strong></article><article><small>Kuitansi</small><strong>{receipts.length}</strong></article></div><p>Selamat datang di SETCool Management.</p></section>}
  {tab==='jobs'&&<section><h1>Laporan Pekerjaan AC</h1><input placeholder="Nama pelanggan" value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})}/><textarea placeholder="Pekerjaan / hasil pemeriksaan" value={form.service} onChange={e=>setForm({...form,service:e.target.value})}/><button className="save" onClick={saveJob}>Simpan Laporan</button><hr/>{jobs.map(j=><article className="row" key={j.id}><b>{j.customer}</b><span>{j.service}</span><small>{j.date}</small></article>)}</section>}
  {tab==='receipts'&&<section><h1>Kuitansi</h1><input placeholder="Nama pelanggan" value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})}/><input placeholder="No. WhatsApp" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><input placeholder="Keperluan pembayaran" value={form.service} onChange={e=>setForm({...form,service:e.target.value})}/><input type="number" placeholder="Total pembayaran" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/><input type="number" placeholder="DP / sudah dibayar" value={form.paid} onChange={e=>setForm({...form,paid:e.target.value})}/><button className="save" onClick={saveReceipt}>Simpan Kuitansi</button><hr/>{receipts.map(r=><article className="receipt" key={r.id}><b>{r.no}</b><strong>{r.customer}</strong><span>{r.service}</span><span>Total: {rupiah(r.amount)} • Dibayar: {rupiah(r.paid)} • Sisa: {rupiah(Number(r.amount)-Number(r.paid))}</span><small>{r.date}</small></article>)}</section>}
  <footer>© {new Date().getFullYear()} SETCool • Latief Choeroni</footer>
 </main>
}