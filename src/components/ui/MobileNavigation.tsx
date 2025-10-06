'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Menu, X, Calendar, Users, Table, MessageCircle, Settings, User } from 'lucide-react';

interface MobileNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isDarkMode: boolean;
  restaurantName: string;
}

const navigationItems = [
  { id: 'agenda', label: 'Agenda', icon: Calendar, color: 'blue' },
  { id: 'reservations', label: 'Reservas', icon: Calendar, color: 'violet' },
  { id: 'tables', label: 'Mesas', icon: Table, color: 'orange' },
  { id: 'clients', label: 'Clientes', icon: Users, color: 'red' },
  { id: 'ai_chat', label: 'IA Chat', icon: MessageCircle, color: 'purple' },
  { id: 'settings', label: 'Config', icon: Settings, color: 'slate' }
];

export default function MobileNavigation({ 
  activeSection, 
  onSectionChange, 
  isDarkMode, 
  restaurantName 
}: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botón flotante para abrir navegación */}
      <div className="fixed bottom-4 right-4 z-50 md:hidden">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={`h-14 w-14 rounded-full shadow-2xl transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gray-800 hover:bg-gray-700 text-white' 
              : 'bg-white hover:bg-gray-50 text-gray-900'
          }`}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Panel de navegación */}
      <div className={`fixed bottom-20 right-4 z-50 md:hidden transition-all duration-300 ${
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        <Card className={`p-4 backdrop-blur-sm border-0 shadow-2xl rounded-2xl transition-all duration-300 ${
          isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'
        }`}>
          <div className="space-y-3">
            <div className="text-center pb-2 border-b border-gray-200/20">
              <h3 className={`text-sm font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{restaurantName}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <Button
                    key={item.id}
                    onClick={() => {
                      onSectionChange(item.id);
                      setIsOpen(false);
                    }}
                    className={`h-12 flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
                      isActive
                        ? `bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 text-white shadow-lg`
                        : isDarkMode 
                          ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Navegación inferior fija para tablets */}
      <div className="fixed bottom-0 left-0 right-0 z-40 hidden md:block lg:hidden">
        <div className={`backdrop-blur-sm border-t transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gray-900/95 border-gray-700/50' 
            : 'bg-white/95 border-slate-200/50'
        }`}>
          <div className="flex items-center justify-around px-4 py-2">
            {navigationItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <Button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  variant="ghost"
                  className={`flex flex-col items-center justify-center space-y-1 h-16 w-16 transition-all duration-300 ${
                    isActive
                      ? `text-${item.color}-600 bg-${item.color}-50`
                      : isDarkMode 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
