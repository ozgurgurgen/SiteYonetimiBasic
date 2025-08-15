// CommonJS version for Netlify Functions
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://ljjohyvxjulofwxuhbze.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxqam9oeXZ4anVsb2Z3eHVoYnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNDcyNTgsImV4cCI6MjA3MDgyMzI1OH0.AIO0pUTYNifbWSfYhzPn2gyTwr580k-F6nHDWx8jVdk';

// Check if we have valid Supabase credentials
const isSupabaseConfigured = supabaseUrl && supabaseKey && 
  supabaseUrl !== 'your-supabase-url' && 
  supabaseKey !== 'your-supabase-anon-key' &&
  supabaseUrl.includes('supabase.co');

const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

// Database operations
class Database {
  
  // Settings operations
  static async getSettings() {
    if (!isSupabaseConfigured || !supabase) {
      return this.getDefaultSettings();
    }
    
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();
      
      if (error && error.code === 'PGRST116') {
        return await this.createDefaultSettings();
      }
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      return this.getDefaultSettings();
    }
  }

  static async updateSettings(settings) {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Settings updated (fallback mode):', settings);
      return settings;
    }
    
    try {
      const { data, error } = await supabase
        .from('settings')
        .upsert(settings)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  static async createDefaultSettings() {
    const defaultSettings = {
      monthly_fee: 100,
      previous_carry_over: 0,
      year: 2025,
      fee_history: [
        {
          amount: 100,
          start_date: '2025-01-01',
          description: 'Başlangıç aidat tutarı'
        }
      ]
    };

    if (!isSupabaseConfigured || !supabase) {
      return defaultSettings;
    }

    try {
      const { data, error } = await supabase
        .from('settings')
        .insert(defaultSettings)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating default settings:', error);
      return this.getDefaultSettings();
    }
  }

  static getDefaultSettings() {
    return {
      monthly_fee: 100,
      previous_carry_over: 0,
      year: 2025,
      fee_history: [
        {
          amount: 100,
          start_date: '2025-01-01',
          description: 'Başlangıç aidat tutarı'
        }
      ]
    };
  }

  // Members operations
  static async getMembers() {
    if (!isSupabaseConfigured || !supabase) {
      return [
        { id: 1, name: 'Test Üyesi 1', payments: {}, created_at: new Date().toISOString() },
        { id: 2, name: 'Test Üyesi 2', payments: {}, created_at: new Date().toISOString() }
      ];
    }
    
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching members:', error);
      return [];
    }
  }

  static async createMember(member) {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Member created (fallback mode):', member.name);
      return { 
        id: Date.now(), 
        name: member.name, 
        payments: member.payments || {}, 
        created_at: new Date().toISOString() 
      };
    }
    
    try {
      const { data, error } = await supabase
        .from('members')
        .insert({
          name: member.name,
          payments: member.payments || {},
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating member:', error);
      throw error;
    }
  }

  static async updateMember(id, updates) {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Member updated (fallback mode):', id, updates);
      return { id, ...updates };
    }
    
    try {
      const { data, error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating member:', error);
      throw error;
    }
  }

  static async deleteMember(id) {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Member deleted (fallback mode):', id);
      return true;
    }
    
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  }

  // Expenses operations
  static async getExpenses() {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }
    
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
  }

  static async createExpense(expense) {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Expense created (fallback mode):', expense);
      return { 
        id: Date.now(), 
        ...expense,
        created_at: new Date().toISOString() 
      };
    }
    
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          date: expense.date,
          type: expense.type,
          description: expense.description,
          amount: expense.amount
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  static async deleteExpense(id) {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Expense deleted (fallback mode):', id);
      return true;
    }
    
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }
}

module.exports = { Database };
