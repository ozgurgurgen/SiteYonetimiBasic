const { Database } = require('./database.js');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const settings = await Database.getSettings();
    const members = await Database.getMembers();
    const expenses = await Database.getExpenses();
    
    // Ensure arrays
    const memberArray = Array.isArray(members) ? members : [];
    const expenseArray = Array.isArray(expenses) ? expenses : [];
    
    const months = getMonthsOfYear(settings?.year || 2025);
    const totalCollected = memberArray.reduce((sum, member) => {
      if (!member || typeof member !== 'object') return sum;
      
      return sum + months.reduce((monthSum, month) => {
        const payment = member.payments?.[month];
        if (payment) {
          if (typeof payment === 'object' && payment.amount !== undefined) {
            return monthSum + (parseFloat(payment.amount) || 0);
          } else if (payment === true) {
            return monthSum + (parseFloat(settings?.monthly_fee) || 100);
          }
        }
        return monthSum;
      }, 0);
    }, 0);
    
    const totalExpenses = expenseArray.reduce((sum, e) => {
      if (!e || typeof e !== 'object') return sum;
      const amount = parseFloat(e.amount) || 0;
      return sum + amount;
    }, 0);
    
    const carryOver = parseFloat(settings?.previous_carry_over) || 0;
    const balance = carryOver + totalCollected - totalExpenses;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        totalCollected: totalCollected || 0, 
        totalExpenses: totalExpenses || 0, 
        balance: balance || 0 
      })
    };
  } catch (error) {
    console.error('Summary calculation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        totalCollected: 0, 
        totalExpenses: 0, 
        balance: 0 
      })
    };
  }
};

function getMonthsOfYear(year) {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
}
