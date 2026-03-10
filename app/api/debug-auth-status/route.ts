import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const headers: Record<string, string> = {};
  
  // Collect all headers
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  
  const authHeader = headers.authorization;
  const hasAuth = !!authHeader;
  
  console.log('Auth debug - Headers received:', {
    hasAuth,
    authHeader: authHeader ? `${authHeader.substring(0, 20)}...` : 'None',
    userAgent: headers['user-agent'],
    origin: headers.origin,
    referer: headers.referer
  });
  
  return NextResponse.json({
    authenticated: hasAuth,
    authHeaderPresent: hasAuth,
    authHeaderLength: authHeader ? authHeader.length : 0,
    timestamp: new Date().toISOString()
  });
}