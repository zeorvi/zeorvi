import { NextRequest, NextResponse } from 'next/server';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Conexión exitosa desde Retell AI",
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(request.headers.entries())
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: "POST exitoso desde Retell AI",
      received_data: body,
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(request.headers.entries())
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Error procesando POST",
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 400 });
  }
}
