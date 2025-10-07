import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-gray-300">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mt-4">Página no encontrada</h2>
          <p className="text-gray-500 mt-2">
            La página que buscas no existe o ha sido movida.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir al inicio
          </Link>
          
          <Link 
            href="/admin"
            className="inline-block w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Panel de administración
          </Link>
        </div>
      </div>
    </div>
  );
}
