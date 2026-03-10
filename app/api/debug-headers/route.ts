import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const headers: Record<string, string> = {};
  
  // Collect all headers
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  
  console.log('Received headers:', headers);
  
  return NextResponse.json({
    headers,
    hasAuth: !!headers.authorization,
    authHeader: headers.authorization || 'Not present'
  });
}