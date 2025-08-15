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
    const path = event.path;
    const pathParts = path.split('/').filter(Boolean);
    
    switch (event.httpMethod) {
      case 'GET':
        const members = await Database.getMembers();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(members.map(member => ({
            ...member,
            payments: member.payments || {}
          })))
        };
        
      case 'POST':
        // Check if this is a payment toggle request
        if (path.includes('/payments/') && path.includes('/toggle')) {
          // Extract ID and yearMonth from path like: /api/members/5/payments/2025-08/toggle
          const membersIndex = pathParts.indexOf('members');
          const paymentsIndex = pathParts.indexOf('payments');
          
          if (membersIndex === -1 || paymentsIndex === -1) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Invalid payment toggle path' })
            };
          }
          
          const id = pathParts[membersIndex + 1];
          const yearMonth = pathParts[paymentsIndex + 1];
          
          const allMembers = await Database.getMembers();
          const member = allMembers.find(m => m.id === parseInt(id));
          
          if (!member) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Member not found' })
            };
          }

          const payments = member.payments || {};
          
          if (payments[yearMonth]) {
            delete payments[yearMonth];
          } else {
            const settings = await Database.getSettings();
            const monthlyFee = getMonthlyFeeForMonth(yearMonth, settings);
            payments[yearMonth] = {
              paid: true,
              amount: monthlyFee,
              paidAt: new Date().toISOString()
            };
          }

          await Database.updateMember(member.id, { payments });
          
          const paid = !!payments[yearMonth];
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              id: member.id, 
              yearMonth, 
              paid, 
              amount: paid ? payments[yearMonth].amount : 0 
            })
          };
        } else {
          // Create new member
          const body = JSON.parse(event.body || '{}');
          if (!body.name) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Name is required' })
            };
          }
          
          const member = await Database.createMember({
            name: body.name,
            payments: {}
          });
          
          return {
            statusCode: 201,
            headers,
            body: JSON.stringify(member)
          };
        }
        
      case 'DELETE':
        const deleteId = pathParts[pathParts.length - 1];
        if (!deleteId || deleteId === 'members') {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Member ID required for deletion' })
          };
        }
        
        await Database.deleteMember(parseInt(deleteId));
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
    console.error('Members API error:', error);
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

function getMonthlyFeeForMonth(yearMonth, settings) {
  const feeHistory = settings?.fee_history || [];
  if (feeHistory.length === 0) {
    return settings?.monthly_fee || 100;
  }
  
  const targetDate = yearMonth + '-01';
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
