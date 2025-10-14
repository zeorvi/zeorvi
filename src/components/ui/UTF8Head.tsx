'use client';

import Head from 'next/head';

interface UTF8HeadProps {
  title?: string;
  description?: string;
}

export default function UTF8Head({ 
  title = 'Restaurante IA Plataforma',
  description = 'Sistema de gestión de restaurantes con inteligencia artificial'
}: UTF8HeadProps) {
  return (
    <Head>
      {/* Configuración UTF-8 para caracteres españoles */}
      <meta charSet="utf-8" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta httpEquiv="Content-Language" content="es-ES" />
      <meta name="language" content="Spanish" />
      <meta name="locale" content="es_ES" />
      
      {/* Título y descripción */}
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Configuración de viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Configuración de idioma para accesibilidad */}
      <html lang="es" />
      
      {/* Configuración para navegadores */}
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      
      {/* Configuración de codificación para APIs */}
      <meta name="charset" content="utf-8" />
      <meta name="encoding" content="utf-8" />
    </Head>
  );
}
