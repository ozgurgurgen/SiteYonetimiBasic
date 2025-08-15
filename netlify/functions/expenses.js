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
    switch (event.httpMethod) {
      case 'GET':
        const expenses = await Database.getExpenses();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(expenses)
        };
        
      case 'POST':
        const body = JSON.parse(event.body);
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
        const pathParts = event.path.split('/');
        const id = pathParts[pathParts.length - 1];
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
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
