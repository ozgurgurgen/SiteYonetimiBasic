import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { nanoid } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'file://', '*'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'frontend')));

// Initial data structure matching Excel
const defaultData = {
  settings: {
    monthlyFee: 100,
    previousCarryOver: 188.50,
    year: 2025
  },
  members: [
    {id: '1', name: 'İsmail', payments: {'2025-08': true, '2025-09': true}, createdAt: '2025-08-13'},
    {id: '2', name: 'Ali', payments: {'2025-08': true, '2025-09': true}, createdAt: '2025-08-13'},
    {id: '3', name: 'Özgür', payments: {'2025-08': true}, createdAt: '2025-08-13'},
    {id: '4', name: 'İsmail', payments: {'2025-08': true, '2025-09': true}, createdAt: '2025-08-13'},
    {id: '5', name: 'Mehmet', payments: {}, createdAt: '2025-08-13'},
    {id: '6', name: 'Murat', payments: {}, createdAt: '2025-08-13'}
  ],
  expenses: [
    {id: '1', date: '2025-08-11', type: 'Temizlik', description: 'Temizlik kimyasalları ve vileda (İsmail 4)', amount: 811.50}
  ]
};

// Basit dosya tabanlı depolama (senkron, küçük veri için yeterli)
const DB_PATH = path.join(process.cwd(), 'db.json');
let db = { data: defaultData };
function load() {
  if (fs.existsSync(DB_PATH)) {
    try { db.data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')); }
    catch { db.data = defaultData; }
  } else {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2));
  }
}
function persist() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db.data, null, 2));
}
load();

function getMonthsOfYear(year) {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
}

function calculateSummary() {
  const { settings, members, expenses } = db.data;
  const months = getMonthsOfYear(settings.year);
  const totalCollected = members.reduce((sum, m) => sum + months.reduce((s, month) => s + (m.payments?.[month] ? settings.monthlyFee : 0), 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const balance = settings.previousCarryOver + totalCollected - totalExpenses;
  return { totalCollected, totalExpenses, balance };
}

// Middleware to ensure payments object
function ensurePayments(member) {
  if (!member.payments) member.payments = {};
  return member;
}

// Settings
app.get('/api/settings', (req, res) => {
  res.json(db.data.settings);
});
app.put('/api/settings', async (req, res) => {
  const { monthlyFee, previousCarryOver, year } = req.body;
  if (monthlyFee !== undefined) db.data.settings.monthlyFee = Number(monthlyFee);
  if (previousCarryOver !== undefined) db.data.settings.previousCarryOver = Number(previousCarryOver);
  if (year !== undefined) db.data.settings.year = Number(year);
  persist();
  res.json(db.data.settings);
});

// Members CRUD
app.get('/api/members', (req, res) => {
  res.json(db.data.members.map(ensurePayments));
});
app.post('/api/members', async (req, res) => {
  const { name } = req.body;
  const member = { id: nanoid(), name, payments: {}, createdAt: new Date().toISOString() };
  db.data.members.push(member);
  persist();
  res.status(201).json(member);
});
app.put('/api/members/:id', async (req, res) => {
  const member = db.data.members.find(m => m.id === req.params.id);
  if (!member) return res.status(404).json({ error: 'Not found' });
  const { name } = req.body;
  if (name) member.name = name;
  persist();
  res.json(member);
});
app.delete('/api/members/:id', async (req, res) => {
  const idx = db.data.members.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const removed = db.data.members.splice(idx, 1)[0];
  persist();
  res.json(removed);
});

// Toggle payment for a month
app.post('/api/members/:id/payments/:yearMonth/toggle', async (req, res) => {
  const member = db.data.members.find(m => m.id === req.params.id);
  if (!member) return res.status(404).json({ error: 'Not found' });
  ensurePayments(member);
  const { yearMonth } = req.params;
  member.payments[yearMonth] = !member.payments[yearMonth];
  persist();
  res.json({ id: member.id, yearMonth, paid: member.payments[yearMonth] });
});

// Expenses
app.get('/api/expenses', (req, res) => {
  res.json(db.data.expenses);
});
app.post('/api/expenses', async (req, res) => {
  const { date, type, description, amount } = req.body;
  const expense = { id: nanoid(), date, type, description, amount: Number(amount) };
  db.data.expenses.push(expense);
  persist();
  res.status(201).json(expense);
});
app.delete('/api/expenses/:id', async (req, res) => {
  const idx = db.data.expenses.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const removed = db.data.expenses.splice(idx, 1)[0];
  persist();
  res.json(removed);
});

// Summary
app.get('/api/summary', (req, res) => {
  res.json(calculateSummary());
});

// Auto-billing endpoint (ensures month exists; no action needed since unpaid is implicit)
app.post('/api/auto-bill/:year/:month', async (req, res) => {
  const { year, month } = req.params;
  const ym = `${year}-${String(month).padStart(2, '0')}`;
  // Nothing to create; unpaid months are simply false/undefined
  // This endpoint can be used as a trigger if needed.
  await db.write();
  res.json({ ok: true, yearMonth: ym });
});

const port = process.env.PORT || 3000;
// Frontend static service
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, '..', 'frontend');

// Fallback route for SPA
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const server = app.listen(port, '127.0.0.1', () => {
  console.log(`Backend listening on http://127.0.0.1:${port}`);
  console.log(`Frontend: http://127.0.0.1:${port}/`);
  console.log(`API Test: http://127.0.0.1:${port}/api/summary`);
});

// Process handlers
process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
