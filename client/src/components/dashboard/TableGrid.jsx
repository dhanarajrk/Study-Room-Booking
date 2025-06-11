import { useEffect, useState } from 'react';
import useBookingStore from '../../store/bookingStore';
import BookingModal from './BookingModal';
import { format } from 'date-fns';

const TableIcon = ({ table, onSelect }) => {
  const { bookings } = useBookingStore();
  const now = new Date();

  const tableBookings = bookings.filter(
    booking => booking.tableId === table._id
  );

  const isOccupied = tableBookings.some(booking => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    return now >= start && now < end;
  });

  const hasFutureBookings = tableBookings.some(
    booking => new Date(booking.startTime) > now
  );

  // Show hover box only if reserved
  const [hovered, setHovered] = useState(false);

  let status = 'available';
  if (isOccupied) {
    status = 'occupied';
  } else if (hasFutureBookings) {
    status = 'reserved';
  }

  const statusClasses = {
    occupied: 'bg-red-100 border-red-300 cursor-not-allowed',
    reserved: 'bg-blue-100 border-blue-300 cursor-pointer relative',
    available: 'bg-green-100 border-green-300 hover:bg-green-200 cursor-pointer',
  };

  return (
    <div
      onClick={() => status !== 'occupied' && onSelect(table)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`p-3 rounded-lg border ${statusClasses[status]}`}
    >
      <div className="font-bold">T{table.tableNumber}</div>

      {status === 'occupied' && (
        <div className="text-xs text-red-600">Occupied</div>
      )}

      {status === 'reserved' && (
        <>
          <div className="text-xs text-blue-600">Reserved</div>

          {hovered && (
            <div className="absolute z-50 mt-1 p-2 text-sm text-left bg-white border rounded shadow w-48">
              <div className="font-semibold mb-1">Booked Slots:</div>
              {tableBookings.map((booking) => {
                const start = new Date(booking.startTime);
                const end = new Date(booking.endTime);

                return (
                  <div key={booking._id} className="text-gray-700">
                    {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default function TableGrid() {
  const { tables, fetchTables, openBookingModal, selectTable, bookingModalOpen } = useBookingStore();

  // Load tables when component mounts
  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleTableSelect = (table) => {
    selectTable(table);
    openBookingModal();
  };

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {tables.map((table) => (
          <TableIcon
            key={table._id}
            table={table}
            onSelect={handleTableSelect}
          />
        ))}
      </div>

      {bookingModalOpen && <BookingModal />}
    </>
  );
}