import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { ReferralErrorCode, ReferralUser } from '@/lib/referral/types';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * POST /api/referral/admin/export
 * Export referral data to CSV or PDF format
 * Requirements: 12.5, 14.5
 * 
 * Request Body:
 * - format: Export format ('csv' or 'pdf')
 * - type: Data type to export ('referrers', 'referrals', 'transactions', 'purchases')
 * - startDate: Start date for filtering (ISO string, optional)
 * - endDate: End date for filtering (ISO string, optional)
 * - filters: Additional filters (optional)
 * 
 * Returns:
 * - data: Exported data as string (CSV) or base64 (PDF)
 * - filename: Suggested filename for download
 * - contentType: MIME type for the export
 */
export async function POST(request: NextRequest) {
  try {
    // Get authorization token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.UNAUTHORIZED,
            message: 'Unauthorized: No token provided',
          },
        },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify the Firebase ID token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.UNAUTHORIZED,
            message: 'Unauthorized: Invalid token',
          },
        },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // Verify user is an admin
    const userDoc = await adminDb
      .collection("staging_referralUsers")
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.UNAUTHORIZED,
            message: 'User not found in referral system',
          },
        },
        { status: 403 }
      );
    }

    const userData = userDoc.data() as ReferralUser;

    if (!userData.isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.UNAUTHORIZED,
            message: 'Unauthorized: Admin access required',
          },
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { format, type, startDate, endDate, filters } = body;

    // Validate format
    if (!format || !['csv', 'pdf'].includes(format)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.INVALID_INPUT,
            message: 'Invalid format. Must be "csv" or "pdf"',
          },
        },
        { status: 400 }
      );
    }

    // Validate type
    if (!type || !['referrers', 'referrals', 'transactions', 'purchases'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.INVALID_INPUT,
            message: 'Invalid type. Must be "referrers", "referrals", "transactions", or "purchases"',
          },
        },
        { status: 400 }
      );
    }

    // Build query based on type
    let data: any[] = [];
    let filename = '';

    const start = startDate ? Timestamp.fromDate(new Date(startDate)) : null;
    const end = endDate ? Timestamp.fromDate(new Date(endDate)) : null;

    if (type === 'referrers') {
      let query = adminDb.collection("staging_referralUsers");

      if (start) {
        query = query.where('createdAt', '>=', start) as any;
      }
      if (end) {
        query = query.where('createdAt', '<=', end) as any;
      }

      const snapshot = await query.get();
      
      data = snapshot.docs.map((doc) => {
        const referrer = doc.data();
        return {
          'User ID': referrer.userId,
          'Full Name': referrer.fullName,
          'Email': referrer.email,
          'Referral Code': referrer.referralCode,
          'Total Referrals': referrer.totalReferrals || 0,
          'Total Points': referrer.totalPoints || 0,
          'Total Revenue': parseFloat((referrer.totalRevenue || 0).toFixed(2)),
          'Is Active': referrer.isActive ? 'Yes' : 'No',
          'Created At': referrer.createdAt && typeof referrer.createdAt.toMillis === 'function'
            ? new Date(referrer.createdAt.toMillis()).toISOString()
            : '',
        };
      });

      filename = `referrers_${Date.now()}`;
    } else if (type === 'referrals') {
      let query = adminDb.collection("staging_referrals");

      if (start) {
        query = query.where('createdAt', '>=', start) as any;
      }
      if (end) {
        query = query.where('createdAt', '<=', end) as any;
      }

      const snapshot = await query.get();
      
      data = snapshot.docs.map((doc) => {
        const referral = doc.data();
        return {
          'Referral ID': referral.id,
          'Referrer ID': referral.referrerId,
          'Referee Name': referral.refereeName,
          'Referee Email': referral.refereeEmail,
          'Referral Code': referral.referralCode,
          'Status': referral.status,
          'Sign Up Date': referral.signUpDate && typeof referral.signUpDate.toMillis === 'function'
            ? new Date(referral.signUpDate.toMillis()).toISOString()
            : '',
          'Total Purchases': referral.totalPurchases || 0,
          'Total Spent': parseFloat((referral.totalSpent || 0).toFixed(2)),
          'Points Earned': referral.pointsEarned || 0,
        };
      });

      filename = `referrals_${Date.now()}`;
    } else if (type === 'transactions') {
      let query = adminDb.collection("staging_referralTransactions");

      if (start) {
        query = query.where('createdAt', '>=', start) as any;
      }
      if (end) {
        query = query.where('createdAt', '<=', end) as any;
      }

      const snapshot = await query.get();
      
      data = snapshot.docs.map((doc) => {
        const transaction = doc.data();
        return {
          'Transaction ID': transaction.id,
          'Referrer ID': transaction.referrerId,
          'Referral ID': transaction.referralId,
          'Type': transaction.type,
          'Points': transaction.points || 0,
          'Amount': transaction.amount ? parseFloat(transaction.amount.toFixed(2)) : '',
          'Description': transaction.description,
          'Referee Name': transaction.metadata?.refereeName || '',
          'Referee Email': transaction.metadata?.refereeEmail || '',
          'Created At': transaction.createdAt && typeof transaction.createdAt.toMillis === 'function'
            ? new Date(transaction.createdAt.toMillis()).toISOString()
            : '',
        };
      });

      filename = `transactions_${Date.now()}`;
    } else if (type === 'purchases') {
      let query = adminDb.collection("staging_referralPurchases");

      if (start) {
        query = query.where('createdAt', '>=', start) as any;
      }
      if (end) {
        query = query.where('createdAt', '<=', end) as any;
      }

      const snapshot = await query.get();
      
      data = snapshot.docs.map((doc) => {
        const purchase = doc.data();
        return {
          'Purchase ID': purchase.id,
          'Referrer ID': purchase.referrerId,
          'Referral ID': purchase.referralId,
          'Referee ID': purchase.refereeId,
          'Order ID': purchase.orderId,
          'Amount': parseFloat((purchase.amount || 0).toFixed(2)),
          'Commission': parseFloat((purchase.commission || 0).toFixed(2)),
          'Points': purchase.points || 0,
          'Status': purchase.status,
          'Created At': purchase.createdAt && typeof purchase.createdAt.toMillis === 'function'
            ? new Date(purchase.createdAt.toMillis()).toISOString()
            : '',
        };
      });

      filename = `purchases_${Date.now()}`;
    }

    // Generate export based on format
    let exportData: string;
    let contentType: string;

    if (format === 'csv') {
      exportData = generateCSV(data);
      contentType = 'text/csv';
      filename += '.csv';
    } else {
      exportData = generatePDF(data, type);
      contentType = 'application/pdf';
      filename += '.pdf';
    }

    return NextResponse.json(
      {
        success: true,
        data: exportData,
        filename,
        contentType,
        recordCount: data.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in admin export endpoint:', error);

    // Handle specific error codes
    if (error.code === ReferralErrorCode.UNAUTHORIZED) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message || 'Unauthorized access',
          },
        },
        { status: 401 }
      );
    }

    if (error.code === ReferralErrorCode.INVALID_INPUT) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message || 'Invalid input',
          },
        },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while exporting data',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Generate CSV from data array
 */
function generateCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const csvRows = [headers.join(',')];

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }
      
      // Escape quotes and wrap in quotes if contains comma
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    });
    
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Escape HTML special characters to prevent XSS attacks
 */
function escapeHtml(text: any): string {
  if (text === null || text === undefined) {
    return '';
  }
  
  const str = String(text);
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return str.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Generate PDF from data array (returns base64 encoded HTML)
 * Note: This is a simplified implementation. In production, use a library like jsPDF or pdfmake
 */
function generatePDF(data: any[], type: string): string {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  
  // Escape the type parameter to prevent XSS
  const escapedType = escapeHtml(type.charAt(0).toUpperCase() + type.slice(1));
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px;
        }
        h1 { 
          color: #333; 
          margin-bottom: 10px;
        }
        .meta {
          color: #666;
          margin-bottom: 20px;
          font-size: 14px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0;
          font-size: 12px;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 8px; 
          text-align: left; 
        }
        th { 
          background-color: #3B82F6; 
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) { 
          background-color: #f2f2f2; 
        }
        tr:hover {
          background-color: #e8e8e8;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <h1>Referral Program Report - ${escapedType}</h1>
      <div class="meta">
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Total Records: ${data.length}</p>
      </div>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${headers.map(h => {
                const value = row[h];
                if (value === null || value === undefined) {
                  return '<td></td>';
                }
                return `<td>${escapeHtml(value)}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">
        <p>This report was generated by the Referral Program Admin Dashboard.</p>
        <p>For questions or support, please contact your system administrator.</p>
      </div>
    </body>
    </html>
  `;

  // Return base64 encoded HTML
  // In production, this would be converted to actual PDF using a library
  return Buffer.from(html).toString('base64');
}
