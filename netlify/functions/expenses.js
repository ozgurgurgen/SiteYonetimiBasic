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
    const pathParts = (event.path || '').split('/').filter(Boolean);
    
    switch (event.httpMethod) {
      case 'GET':
        try {
          const expenses = await Database.getExpenses();
          const expenseArray = Array.isArray(expenses) ? expenses : [];
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(expenseArray)
          };
        } catch (error) {
          console.error('Error getting expenses:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: 'Failed to get expenses',
              message: error.message
            })
          };
        }
        
      case 'POST':
        try {
          const body = JSON.parse(event.body || '{}');
          
          if (!body.date || !body.type || !body.description || body.amount === undefined) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Missing required fields: date, type, description, amount' })
            };
          }
          
          // Validate and parse amount as decimal
          const amount = parseFloat(body.amount);
          if (isNaN(amount) || amount < 0) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Amount must be a valid positive number' })
            };
          }
          
          const expense = await Database.createExpense({
            date: body.date,
            type: body.type,
            description: body.description,
            amount: amount
          });
          
          return {
            statusCode: 201,
            headers,
            body: JSON.stringify(expense)
          };
        } catch (error) {
          console.error('Error creating expense:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: 'Failed to create expense',
              message: error.message
            })
          };
        }
        
      case 'DELETE':
        try {
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
        } catch (error) {
          console.error('Error deleting expense:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: 'Failed to delete expense',
              message: error.message
            })
          };
        }
        
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
