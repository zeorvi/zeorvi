import { NextRequest, NextResponse } from 'next/server';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {}
  };

  try {
    // Check 1: Importar bcryptjs
    diagnostics.checks.bcryptjs = { status: 'checking' };
    try {
      const bcrypt = require('bcryptjs');
      diagnostics.checks.bcryptjs = { status: 'ok', version: 'imported' };
    } catch (error) {
      diagnostics.checks.bcryptjs = { status: 'error', message: error instanceof Error ? error.message : String(error) };
    }

    // Check 2: Importar jsonwebtoken
    diagnostics.checks.jwt = { status: 'checking' };
    try {
      const jwt = require('jsonwebtoken');
      diagnostics.checks.jwt = { status: 'ok', version: 'imported' };
    } catch (error) {
      diagnostics.checks.jwt = { status: 'error', message: error instanceof Error ? error.message : String(error) };
    }

    // Check 3: Importar config
    diagnostics.checks.config = { status: 'checking' };
    try {
      const { config } = require('@/lib/config');
      diagnostics.checks.config = { 
        status: 'ok', 
        hasJwtSecret: !!config.jwt.secret,
        jwtSecretLength: config.jwt.secret?.length || 0
      };
    } catch (error) {
      diagnostics.checks.config = { status: 'error', message: error instanceof Error ? error.message : String(error) };
    }

    // Check 4: Importar hardcodedUsers
    diagnostics.checks.hardcodedUsers = { status: 'checking' };
    try {
      const { HARDCODED_USERS, findUserByEmail } = require('@/lib/auth/hardcodedUsers');
      diagnostics.checks.hardcodedUsers = { 
        status: 'ok', 
        userCount: HARDCODED_USERS.length,
        users: HARDCODED_USERS.map((u: any) => ({ email: u.email, role: u.role }))
      };
    } catch (error) {
      diagnostics.checks.hardcodedUsers = { status: 'error', message: error instanceof Error ? error.message : String(error) };
    }

    // Check 5: Importar authService
    diagnostics.checks.authService = { status: 'checking' };
    try {
      const authService = require('@/lib/auth');
      diagnostics.checks.authService = { status: 'ok', hasDefault: !!authService.default };
    } catch (error) {
      diagnostics.checks.authService = { status: 'error', message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined };
    }

    // Check 6: Test login simulation
    diagnostics.checks.loginSimulation = { status: 'checking' };
    try {
      const authService = require('@/lib/auth').default;
      const { findUserByEmail, verifyPassword } = require('@/lib/auth/hardcodedUsers');
      
      const testEmail = 'admin@lagaviota.com';
      const testPassword = 'lagaviota123';
      
      const user = await findUserByEmail(testEmail);
      if (!user) {
        diagnostics.checks.loginSimulation = { status: 'error', message: 'User not found' };
      } else {
        const isValid = await verifyPassword(testPassword, user.passwordHash);
        diagnostics.checks.loginSimulation = { 
          status: 'ok', 
          userFound: true,
          passwordValid: isValid
        };
      }
    } catch (error) {
      diagnostics.checks.loginSimulation = { status: 'error', message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined };
    }

    return NextResponse.json(diagnostics, { status: 200 });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      ...diagnostics,
      globalError: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

