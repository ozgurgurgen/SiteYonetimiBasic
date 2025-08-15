const { Database } = require('./database.js');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    switch (event.httpMethod) {
      case 'GET':
        const settings = await Database.getSettings();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(settings)
        };
        
      case 'PUT':
        const body = JSON.parse(event.body || '{}');
        const { monthlyFee, previousCarryOver, year } = body;
        const currentSettings = await Database.getSettings();
        
        if (monthlyFee !== undefined && parseFloat(monthlyFee) !== currentSettings.monthly_fee) {
          const newFee = parseFloat(monthlyFee);
          const today = new Date().toISOString().split('T')[0];
          
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
          
          feeHistory.sort((a, b) => a.start_date.localeCompare(b.start_date));
          
          currentSettings.monthly_fee = newFee;
          currentSettings.fee_history = feeHistory;
        }
        
        if (previousCarryOver !== undefined) {
          currentSettings.previous_carry_over = parseFloat(previousCarryOver);
        }
        
        if (year !== undefined) {
          currentSettings.year = parseInt(year);
        }
        
        const updatedSettings = await Database.updateSettings(currentSettings);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(updatedSettings)
        };
        
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Settings API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
