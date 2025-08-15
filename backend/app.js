import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { nanoid } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
// Import database operations
import { initializeDatabase, Database } from './database.js';

// Load environment variables
dotenv.config();

const app = express();

// Initialize database connection
initializeDatabase();

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

function getMonthlyFeeForMonth(yearMonth, settings) {
  const feeHistory = settings?.fee_history || [];
  if (feeHistory.length === 0) {
    return settings?.monthly_fee || 100;
  }
  
  // Tarihi YYYY-MM formatına çevir
  const targetDate = yearMonth + '-01';
  
  // Geçmişe doğru ara, o ay için geçerli olan tutarı bul
  let applicableFee = feeHistory[0].amount;
  
  for (const fee of feeHistory) {
    if (fee.start_date <= targetDate) {
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

async function calculateSummary() {
  try {
    const settings = await Database.getSettings();
    const members = await Database.getMembers();
    const expenses = await Database.getExpenses();
    
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
            return monthSum + settings.monthly_fee;
          }
        }
        return monthSum;
      }, 0);
    }, 0);
    
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const balance = settings.previous_carry_over + totalCollected - totalExpenses;
    
    return { totalCollected, totalExpenses, balance };
  } catch (error) {
    console.error('Calculate summary error:', error);
    return { totalCollected: 0, totalExpenses: 0, balance: 0 };
  }
}

function ensurePayments(member) {
  if (!member.payments) member.payments = {};
  return member;
}

// Routes
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await Database.getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({ error: 'Settings fetch failed' });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const { monthlyFee, previousCarryOver, year } = req.body;
    const currentSettings = await Database.getSettings();
    
    // Aidat tutarı değişiyorsa geçmişe kaydet
    if (monthlyFee !== undefined && Number(monthlyFee) !== currentSettings.monthly_fee) {
      const newFee = Number(monthlyFee);
      const today = new Date().toISOString().split('T')[0];
      
      // Fee history'yi güncelle
      const feeHistory = currentSettings.fee_history || [];
      
      if (feeHistory.length === 0) {
        feeHistory.push({
          amount: currentSettings.monthly_fee,
          start_date: `${currentSettings.year}-01-01`,
          description: 'Başlangıç aidat tutarı'
        });
      }
      
      feeHistory.push({
        amount: newFee,
        start_date: today,
        description: `Aidat ${currentSettings.monthly_fee}₺'den ${newFee}₺'ye güncellendi`
      });
      
      // Tarihe göre sırala
      feeHistory.sort((a, b) => a.start_date.localeCompare(b.start_date));
      
      currentSettings.monthly_fee = newFee;
      currentSettings.fee_history = feeHistory;
    }
    
    if (previousCarryOver !== undefined) {
      currentSettings.previous_carry_over = Number(previousCarryOver);
    }
    
    if (year !== undefined) {
      currentSettings.year = Number(year);
    }
    
    const updatedSettings = await Database.updateSettings(currentSettings);
    res.json(updatedSettings);
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ error: 'Settings update failed' });
  }
});

app.get('/api/members', async (req, res) => {
  try {
    const members = await Database.getMembers();
    res.json(members.map(ensurePayments));
  } catch (error) {
    console.error('Members fetch error:', error);
    res.status(500).json({ error: 'Members fetch failed' });
  }
});

app.post('/api/members', async (req, res) => {
  try {
    const { name } = req.body;
    const member = {
      name,
      payments: {}
    };
    
    const createdMember = await Database.createMember(member);
    res.status(201).json(createdMember);
  } catch (error) {
    console.error('Member creation error:', error);
    res.status(500).json({ error: 'Member creation failed' });
  }
});

app.delete('/api/members/:id', async (req, res) => {
  try {
    await Database.deleteMember(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Member deletion error:', error);
    res.status(500).json({ error: 'Member deletion failed' });
  }
});

app.post('/api/members/:id/payments/:yearMonth/toggle', async (req, res) => {
  try {
    const members = await Database.getMembers();
    const member = members.find(m => m.id === parseInt(req.params.id));
    
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const { yearMonth } = req.params;
    const payments = member.payments || {};
    
    if (payments[yearMonth]) {
      // Ödeme varsa iptal et
      delete payments[yearMonth];
    } else {
      // O ay için geçerli olan aidat tutarını kullan
      const settings = await Database.getSettings();
      const monthlyFee = getMonthlyFeeForMonth(yearMonth, settings);
      payments[yearMonth] = {
        paid: true,
        amount: monthlyFee,
        paidAt: new Date().toISOString()
      };
    }

    // Member'ı güncelle
    await Database.updateMember(member.id, { payments });
    
    const paid = !!payments[yearMonth];
    res.json({ 
      id: member.id, 
      yearMonth, 
      paid, 
      amount: paid ? payments[yearMonth].amount : 0 
    });
  } catch (error) {
    console.error('Payment toggle error:', error);
    res.status(500).json({ error: 'Payment toggle failed' });
  }
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

app.get('/api/summary', async (req, res) => {
  try {
    const summary = await calculateSummary();
    res.json(summary);
  } catch (error) {
    console.error('Summary calculation error:', error);
    res.status(500).json({ error: 'Summary calculation failed' });
  }
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
