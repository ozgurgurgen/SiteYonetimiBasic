const { Database } = require('./database.js');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const pathParts = event.path.split('/').filter(Boolean);
    
    switch (event.httpMethod) {
      case 'GET':
        const expenses = await Database.getExpenses();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(expenses)
        };
        
      case 'POST':
        const body = JSON.parse(event.body || '{}');
        
        if (!body.date || !body.type || !body.description || body.amount === undefined) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing required fields: date, type, description, amount' })
          };
        }
        
        const expense = await Database.createExpense({
          date: body.date,
          type: body.type,
          description: body.description,
          amount: Number(body.amount)
        });
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(expense)
        };
        
      case 'DELETE':
        const id = pathParts[pathParts.length - 1];
        if (!id || id === 'expenses') {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Expense ID required for deletion' })
          };
        }
        
        await Database.deleteExpense(parseInt(id));
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };
        
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Expenses API error:', error);
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
