/**
 * Sistema de seguridad avanzado anti-hackeo
 * Protección invisible al usuario
 */

import { NextRequest } from 'next/server';
import { logger } from './logger';

// Configuración de seguridad
const SECURITY_CONFIG = {
  // Rate limiting
  MAX_REQUESTS_PER_MINUTE: 60,
  MAX_REQUESTS_PER_HOUR: 1000,
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutos
  
  // Headers de seguridad
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.firebase.com https://*.firebase.com https://*.twilio.com https://*.retellai.com https://accounts.google.com; frame-src 'self' https://accounts.google.com https://drive.google.com; frame-ancestors 'self' https://accounts.google.com https://drive.google.com;"
  },
  
  // Patrones de ataque conocidos
  MALICIOUS_PATTERNS: [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /union\s+select/gi,
    /drop\s+table/gi,
    /delete\s+from/gi,
    /insert\s+into/gi,
    /update\s+set/gi,
    /exec\s*\(/gi,
    /eval\s*\(/gi,
    /\.\.\//gi, // Directory traversal
    /\/etc\/passwd/gi,
    /\/proc\/version/gi,
    /cmd\.exe/gi,
    /powershell/gi,
    /bash/gi
  ],
  
  // IPs bloqueadas (se puede expandir)
  BLOCKED_IPS: new Set<string>([
    // Agregar IPs maliciosas conocidas aquí
  ]),
  
  // User agents sospechosos
  SUSPICIOUS_USER_AGENTS: [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /wget/i,
    /curl/i,
    /python/i,
    /php/i,
    /java/i,
    /nikto/i,
    /sqlmap/i,
    /nmap/i,
    /masscan/i,
    /zap/i,
    /burp/i
  ]
};

// Cache para rate limiting
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();
const loginAttemptsCache = new Map<string, { attempts: number; lockoutUntil: number }>();

/**
 * Verificar si una IP está bloqueada
 */
export function isIPBlocked(ip: string): boolean {
  return SECURITY_CONFIG.BLOCKED_IPS.has(ip);
}

/**
 * Verificar rate limiting
 */
export function checkRateLimit(ip: string, endpoint: string): { allowed: boolean; resetTime: number } {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minuto
  
  const current = rateLimitCache.get(key);
  
  if (!current || now > current.resetTime) {
    // Nueva ventana de tiempo
    rateLimitCache.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return { allowed: true, resetTime: now + windowMs };
  }
  
  if (current.count >= SECURITY_CONFIG.MAX_REQUESTS_PER_MINUTE) {
    logger.warn('Rate limit exceeded', { ip, endpoint, count: current.count });
    return { allowed: false, resetTime: current.resetTime };
  }
  
  current.count++;
  return { allowed: true, resetTime: current.resetTime };
}

/**
 * Verificar intentos de login
 */
export function checkLoginAttempts(identifier: string): { allowed: boolean; attemptsLeft: number } {
  const now = Date.now();
  const current = loginAttemptsCache.get(identifier);
  
  if (!current || now > current.lockoutUntil) {
    // Reset intentos
    loginAttemptsCache.set(identifier, {
      attempts: 0,
      lockoutUntil: 0
    });
    return { allowed: true, attemptsLeft: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS };
  }
  
  if (current.attempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
    logger.warn('Login attempts exceeded', { identifier, attempts: current.attempts });
    return { allowed: false, attemptsLeft: 0 };
  }
  
  return { 
    allowed: true, 
    attemptsLeft: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - current.attempts 
  };
}

/**
 * Registrar intento de login fallido
 */
export function recordFailedLogin(identifier: string): void {
  const current = loginAttemptsCache.get(identifier);
  const now = Date.now();
  
  if (!current || now > current.lockoutUntil) {
    loginAttemptsCache.set(identifier, {
      attempts: 1,
      lockoutUntil: 0
    });
  } else {
    current.attempts++;
    if (current.attempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      current.lockoutUntil = now + SECURITY_CONFIG.LOGIN_LOCKOUT_DURATION;
      logger.warn('Account locked due to failed login attempts', { 
        identifier, 
        lockoutUntil: new Date(current.lockoutUntil).toISOString() 
      });
    }
  }
}

/**
 * Reset intentos de login (login exitoso)
 */
export function resetLoginAttempts(identifier: string): void {
  loginAttemptsCache.delete(identifier);
}

/**
 * Verificar patrones maliciosos en el contenido
 */
export function detectMaliciousContent(content: string): { isMalicious: boolean; pattern: string } {
  for (const pattern of SECURITY_CONFIG.MALICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      logger.warn('Malicious content detected', { 
        pattern: pattern.toString(), 
        content: content.substring(0, 100) 
      });
      return { isMalicious: true, pattern: pattern.toString() };
    }
  }
  return { isMalicious: false, pattern: '' };
}

/**
 * Verificar User Agent sospechoso
 */
export function isSuspiciousUserAgent(userAgent: string): boolean {
  return SECURITY_CONFIG.SUSPICIOUS_USER_AGENTS.some(pattern => pattern.test(userAgent));
}

/**
 * Obtener IP real del request
 */
export function getClientIP(request: NextRequest): string {
  // Intentar obtener IP de diferentes headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

/**
 * Aplicar headers de seguridad
 */
export function applySecurityHeaders(): Record<string, string> {
  return SECURITY_CONFIG.SECURITY_HEADERS;
}

/**
 * Validar y sanitizar entrada de usuario
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Detectar contenido malicioso
  const maliciousCheck = detectMaliciousContent(input);
  if (maliciousCheck.isMalicious) {
    logger.warn('Malicious input blocked', { 
      pattern: maliciousCheck.pattern,
      input: input.substring(0, 50) 
    });
    return '';
  }
  
  // Sanitización básica
  return input
    .trim()
    .replace(/[<>]/g, '') // Remover < >
    .substring(0, 1000); // Limitar longitud
}

/**
 * Generar token CSRF
 */
export function generateCSRFToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Verificar token CSRF
 */
export function verifyCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken && token.length === 32;
}

/**
 * Limpiar cache de seguridad periódicamente
 */
export function cleanupSecurityCache(): void {
  const now = Date.now();
  
  // Limpiar rate limit cache expirado
  for (const [key, value] of rateLimitCache.entries()) {
    if (now > value.resetTime) {
      rateLimitCache.delete(key);
    }
  }
  
  // Limpiar login attempts cache expirado
  for (const [key, value] of loginAttemptsCache.entries()) {
    if (now > value.lockoutUntil) {
      loginAttemptsCache.delete(key);
    }
  }
}

// Limpiar cache cada 5 minutos
setInterval(cleanupSecurityCache, 5 * 60 * 1000);
