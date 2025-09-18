'use client';

import ReservationCalendar from './ReservationCalendar';

interface ReservationManagementProps {
  restaurantId: string;
}

export default function ReservationManagement({ restaurantId }: ReservationManagementProps) {
  return (
    <div>
      {/* Calendario completo */}
      <ReservationCalendar restaurantId={restaurantId} />
    </div>
  );
}

