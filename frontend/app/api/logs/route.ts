import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    // Read logs.json from project root (one level up from frontend)
    const logsPath = join(process.cwd(), '..', 'logs.json');
    const fileContents = await readFile(logsPath, 'utf-8');
    const logs = JSON.parse(fileContents);
    
    return NextResponse.json(logs, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    // Return empty array if file doesn't exist yet
    return NextResponse.json([], {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}

