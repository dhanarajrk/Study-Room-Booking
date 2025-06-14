import { useEffect, useState } from 'react';
import useBookingStore from '../../store/bookingStore';
import BookingConfirmation from './BookingConfimation';
import { format, isBefore, differenceInMinutes, addMinutes } from 'date-fns';

const BUFFER_MINUTES = 30;
const MIN_BOOKING_MINUTES = 30;

const TableIcon = ({ table, onSelect }) => {
  const { bookings, selectedDate } = useBookingStore();
  const now = new Date();

  const tableBookings = bookings.filter(
    booking => booking.tableId === table._id || booking.table?.toString() === table._id.toString()
  );

  const isCurrentlyOccupied = tableBookings.some(booking => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    return now >= start && now < end;
  });

  const hasFutureBookings = tableBookings.some(
    booking => new Date(booking.startTime) > now
  );

  // Check if table has any available time slots for booking
  const hasAvailableSlots = checkIfTableHasAvailableSlots(table, bookings, selectedDate || new Date());

  // Show hover box only if reserved
  const [hovered, setHovered] = useState(false);

  let status = 'available';
  if (isCurrentlyOccupied) {
    status = 'occupied';
  } else if (!hasAvailableSlots) {
    status = 'occupied'; // Use occupied status for fully booked
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
        <div className="text-xs text-red-600">Full booked</div>
      )}

      {status === 'reserved' && (
        <>
          <div className="text-xs text-blue-600">Available free slots</div>

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

// Helper function to check if a table has any available booking slots
function checkIfTableHasAvailableSlots(table, allBookings, selectedDate) {
  const now = new Date();
  
  // Generate all possible time slots for the selected date
  const availableSlots = [];
  const baseDate = new Date(selectedDate);
  
  for (let hour = 8; hour <= 23; hour++) {
    availableSlots.push(new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hour, 0));
    if (hour < 23) {
      availableSlots.push(new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hour, 30));
    }
  }
  
  // Add the final 11:30 PM slot if not already present
  if (!availableSlots.some(slot => slot.getHours() === 23 && slot.getMinutes() === 30)) {
    availableSlots.push(new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 30));
  }

  // Filter table bookings
  const tableBookings = allBookings.filter(
    booking => booking.tableId === table._id || booking.table?.toString() === table._id.toString()
  );

  // Create bookings with buffer zones
  const tableBookingsWithBuffers = tableBookings
    .map(booking => ({
      start: addMinutes(new Date(booking.startTime), -BUFFER_MINUTES),
      end: addMinutes(new Date(booking.endTime), BUFFER_MINUTES)
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  // Check if any start time slot has valid end time options
  for (const startSlot of availableSlots) {
    // Skip past slots
    if (isBefore(startSlot, now)) continue;

    // Check if this start slot is available (not in any booking's buffer zone)
    const isStartSlotAvailable = !tableBookingsWithBuffers.some(booking => 
      startSlot >= booking.start && startSlot < booking.end
    );

    if (!isStartSlotAvailable) continue;

    // Find the next conflicting booking after this start time
    const nextConflictingBooking = tableBookingsWithBuffers.find(booking => 
      booking.start > startSlot
    );

    // Check if there are valid end times for this start slot
    const hasValidEndTimes = availableSlots.some(endSlot => {
      const minutes = differenceInMinutes(endSlot, startSlot);
      
      // Must be after start time and meet minimum duration
      if (!isBefore(startSlot, endSlot) || minutes < MIN_BOOKING_MINUTES) return false;

      // If there's a next booking, make sure our end time doesn't go into its buffer zone
      if (nextConflictingBooking && endSlot > nextConflictingBooking.start) {
        return false;
      }

      // Ensure the entire time range is available
      const isRangeValid = !tableBookingsWithBuffers.some(booking => {
        return (
          (startSlot >= booking.start && startSlot < booking.end) || // start overlaps
          (endSlot > booking.start && endSlot <= booking.end) ||     // end overlaps
          (startSlot <= booking.start && endSlot >= booking.end)     // fully encompasses
        );
      });

      return isRangeValid;
    });

    if (hasValidEndTimes) {
      return true; // Found at least one valid booking slot
    }
  }

  return false; // No available booking slots found
}

export default function TableGrid() {
  const { tables, fetchTables, openBookingModal, selectTable, bookingModalOpen } = useBookingStore();

  // Load tables when component mounts
  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleTableSelect = (table) => {
    selectTable(table);
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
    </>
  );
}