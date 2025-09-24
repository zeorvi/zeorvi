import { Card, CardContent } from '@/components/ui/card';

export default function DashboardPreview() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-4 py-2 rounded-full border border-green-400/30 mb-6 shadow-lg shadow-green-500/10">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-300 text-sm font-bold uppercase tracking-wide">Vista Exclusiva</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Todo lo que necesitas <span className="bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">en un solo lugar</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Plano de Mesas como el real */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-cyan-400/30 p-6 shadow-2xl shadow-cyan-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-lg">Plano de Mesas</h3>
                <div className="flex space-x-3 items-center">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                    <span className="text-xs text-gray-300">Libre</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                    <span className="text-xs text-gray-300">Reservada</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                    <span className="text-xs text-gray-300">Ocupada</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { id: 'M1', color: 'bg-green-500', status: 'libre' },
                  { id: 'M2', color: 'bg-yellow-500', status: 'reservada' },
                  { id: 'M3', color: 'bg-red-500', status: 'ocupada' },
                  { id: 'M4', color: 'bg-green-500', status: 'libre' },
                  { id: 'M5', color: 'bg-yellow-500', status: 'reservada' },
                  { id: 'M6', color: 'bg-red-500', status: 'ocupada' },
                  { id: 'M7', color: 'bg-green-500', status: 'libre' },
                  { id: 'M8', color: 'bg-yellow-500', status: 'reservada' },
                  { id: 'M9', color: 'bg-red-500', status: 'ocupada' },
                  { id: 'M10', color: 'bg-green-500', status: 'libre' },
                  { id: 'M11', color: 'bg-yellow-500', status: 'reservada' },
                  { id: 'M12', color: 'bg-red-500', status: 'ocupada' }
                ].map((mesa, i) => (
                  <div key={i} className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold text-white ${mesa.color} shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 cursor-pointer border-2 border-white/30 hover:border-white/50`}>
                    <span className="drop-shadow-sm">{mesa.id}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reservas de Hoy */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-purple-400/30 p-6 shadow-2xl shadow-purple-500/20">
              <h3 className="text-white font-semibold mb-4 text-lg">Reservas de Hoy</h3>
              <div className="space-y-3">
                {[
                  { time: '13:00', name: 'Ana Martín', people: 2, status: 'Confirmada' },
                  { time: '14:30', name: 'Carlos López', people: 4, status: 'Pendiente' },
                  { time: '20:00', name: 'María García', people: 6, status: 'Confirmada' }
                ].map((reservation, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors border border-slate-600/30">
                    <div>
                      <div className="text-white font-semibold">{reservation.time}</div>
                      <div className="text-gray-300 text-sm">{reservation.name} • {reservation.people} personas</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${
                      reservation.status === 'Confirmada' 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                        : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                    }`}>
                      {reservation.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
