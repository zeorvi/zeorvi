import { Bot } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="h-8 w-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl">ZEORVI</span>
        </div>
        <p className="text-gray-400">
          © 2024 ZEORVI - Automatización inteligente para restaurantes
        </p>
      </div>
    </footer>
  );
}
