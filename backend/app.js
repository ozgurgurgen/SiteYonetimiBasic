import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { nanoid } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// CORS ayarları
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Initial data
const defaultData = {
  settings: {
    monthlyFee: 100,
    previousCarryOver: 188.50,
    year: 2025,
    feeHistory: [
      {
        amount: 100,
        startDate: '2025-01-01',
        description: 'Başlangıç aidat tutarı'
      }
    ]
  },
  members: [
    {id: '1', name: 'İsmail', payments: {'2025-08': {paid: true, amount: 100}}, createdAt: '2025-08-13'},
    {id: '2', name: 'Ali', payments: {'2025-08': {paid: true, amount: 100}, '2025-09': {paid: true, amount: 100}}, createdAt: '2025-08-13'},
    {id: '3', name: 'Özgür', payments: {'2025-08': {paid: true, amount: 100}}, createdAt: '2025-08-13'},
    {id: '4', name: 'İsmail', payments: {'2025-08': {paid: true, amount: 100}, '2025-09': {paid: true, amount: 100}}, createdAt: '2025-08-13'},
    {id: '5', name: 'Mehmet', payments: {}, createdAt: '2025-08-13'},
    {id: '6', name: 'Murat', payments: {}, createdAt: '2025-08-13'}
  ],
  expenses: [
    {id: '1', date: '2025-08-11', type: 'Temizlik', description: 'Temizlik kimyasalları ve vileda (İsmail 4)', amount: 811.50}
  ]
};

// Simple file-based storage (local development)
// In production (Vercel), data will be in-memory only
const DB_PATH = path.join(process.cwd(), 'db.json');
let db = { data: defaultData };

function load() {
  try {
    // Only try to read file in local development
    if (process.env.NODE_ENV !== 'production' && fs.existsSync(DB_PATH)) {
      db.data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    } else {
      // In production or first run, use default data
      db.data = { ...defaultData };
    }
  } catch (e) {
    console.error('DB load error:', e);
    db.data = { ...defaultData };
  }
}

function persist() {
  try {
    // Only persist to file in local development
    if (process.env.NODE_ENV !== 'production') {
      fs.writeFileSync(DB_PATH, JSON.stringify(db.data, null, 2));
    }
    // In production, data is only in memory (resets on each deployment)
  } catch (e) {
    console.error('DB persist error:', e);
  }
}

load();

function getMonthlyFeeForMonth(yearMonth) {
  const feeHistory = db.data.settings.feeHistory || [];
  if (feeHistory.length === 0) {
    return db.data.settings.monthlyFee;
  }
  
  // Tarihi YYYY-MM formatına çevir
  const targetDate = yearMonth + '-01';
  
  // Geçmişe doğru ara, o ay için geçerli olan tutarı bul
  let applicableFee = feeHistory[0].amount;
  
  for (const fee of feeHistory) {
    if (fee.startDate <= targetDate) {
      applicableFee = fee.amount;
    } else {
      break;
    }
  }
  
  return applicableFee;
}

function getMonthsOfYear(year) {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
}

function calculateSummary() {
  const { settings, members, expenses } = db.data;
  const months = getMonthsOfYear(settings.year);
  const totalCollected = members.reduce((sum, member) => {
    return sum + months.reduce((monthSum, month) => {
      const payment = member.payments?.[month];
      // Eğer payment obje ise amount'unu al, boolean ise eski sistemi kullan
      if (payment) {
        if (typeof payment === 'object' && payment.amount !== undefined) {
          return monthSum + payment.amount;
        } else if (payment === true) {
          // Geriye uyumluluk için eski boolean sistemi destekle
          return monthSum + settings.monthlyFee;
        }
      }
      return monthSum;
    }, 0);
  }, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const balance = settings.previousCarryOver + totalCollected - totalExpenses;
  return { totalCollected, totalExpenses, balance };
}

function ensurePayments(member) {
  if (!member.payments) member.payments = {};
  return member;
}

// Routes
app.get('/api/settings', (req, res) => {
  res.json(db.data.settings);
});

app.put('/api/settings', (req, res) => {
  const { monthlyFee, previousCarryOver, year } = req.body;
  
  // Aidat tutarı değişiyorsa geçmişe kaydet
  if (monthlyFee !== undefined && Number(monthlyFee) !== db.data.settings.monthlyFee) {
    const newFee = Number(monthlyFee);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD formatı
    
    // Fee history yoksa oluştur
    if (!db.data.settings.feeHistory) {
      db.data.settings.feeHistory = [{
        amount: db.data.settings.monthlyFee,
        startDate: `${db.data.settings.year}-01-01`,
        description: 'Başlangıç aidat tutarı'
      }];
    }
    
    // Yeni tutarı geçmişe ekle
    db.data.settings.feeHistory.push({
      amount: newFee,
      startDate: today,
      description: `Aidat ${db.data.settings.monthlyFee}₺'den ${newFee}₺'ye güncellendi`
    });
    
    // Tarihe göre sırala
    db.data.settings.feeHistory.sort((a, b) => a.startDate.localeCompare(b.startDate));
    
    db.data.settings.monthlyFee = newFee;
  }
  
  if (previousCarryOver !== undefined) db.data.settings.previousCarryOver = Number(previousCarryOver);
  if (year !== undefined) db.data.settings.year = Number(year);
  persist();
  res.json(db.data.settings);
});

app.get('/api/members', (req, res) => {
  res.json(db.data.members.map(ensurePayments));
});

app.post('/api/members', (req, res) => {
  const { name } = req.body;
  const member = { id: nanoid(), name, payments: {}, createdAt: new Date().toISOString() };
  db.data.members.push(member);
  persist();
  res.status(201).json(member);
});

app.delete('/api/members/:id', (req, res) => {
  const idx = db.data.members.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const removed = db.data.members.splice(idx, 1)[0];
  persist();
  res.json(removed);
});

app.post('/api/members/:id/payments/:yearMonth/toggle', (req, res) => {
  const member = db.data.members.find(m => m.id === req.params.id);
  if (!member) return res.status(404).json({ error: 'Not found' });
  ensurePayments(member);
  const { yearMonth } = req.params;
  
  if (member.payments[yearMonth]) {
    // Ödeme varsa iptal et
    delete member.payments[yearMonth];
  } else {
    // O ay için geçerli olan aidat tutarını kullan
    const monthlyFee = getMonthlyFeeForMonth(yearMonth);
    member.payments[yearMonth] = {
      paid: true,
      amount: monthlyFee,
      paidAt: new Date().toISOString()
    };
  }
  
  persist();
  const paid = !!member.payments[yearMonth];
  res.json({ id: member.id, yearMonth, paid, amount: paid ? member.payments[yearMonth].amount : 0 });
});

app.get('/api/expenses', (req, res) => {
  res.json(db.data.expenses);
});

app.post('/api/expenses', (req, res) => {
  const { date, type, description, amount } = req.body;
  const expense = { id: nanoid(), date, type, description, amount: Number(amount) };
  db.data.expenses.push(expense);
  persist();
  res.status(201).json(expense);
});

app.delete('/api/expenses/:id', (req, res) => {
  const idx = db.data.expenses.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const removed = db.data.expenses.splice(idx, 1)[0];
  persist();
  res.json(removed);
});

app.get('/api/summary', (req, res) => {
  res.json(calculateSummary());
});

// Fallback route
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const port = process.env.PORT || 3000;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Backend listening on http://localhost:${port}`);
  console.log(`📱 Frontend: http://localhost:${port}/`);
  console.log(`🔧 Admin: http://localhost:${port}/admin.html`);
  console.log(`🧪 API Test: http://localhost:${port}/api/summary`);
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
