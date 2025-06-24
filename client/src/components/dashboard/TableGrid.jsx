import { useEffect, useState } from 'react';
import useBookingStore from '../../store/bookingStore';
import { format, isBefore, differenceInMinutes, addMinutes } from 'date-fns';
import socket from '../../socket/socket.js';
import useAuthStore from '../../store/authStore.js';

const BUFFER_MINUTES = 30;
const MIN_BOOKING_MINUTES = 30;

const TableIcon = ({ table, onSelect }) => {
  const { bookings, selectedDate } = useBookingStore();
  const { user } = useAuthStore();

  const now = new Date();

  const tableBookings = bookings.filter(
    booking => (booking.tableId === table._id || booking.table?.toString() === table._id.toString()) && booking.status !== 'cancelled'
  );

  const isCurrentlyOccupied = tableBookings.some(booking => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    return now >= start && now < end;
  });

  const hasFutureBookings = tableBookings.some(
    booking => new Date(booking.startTime) > now
  );

  const hasAvailableSlots = checkIfTableHasAvailableSlots(table, bookings, selectedDate || new Date());

  const [hovered, setHovered] = useState(false);

  let status = 'available';
  if (isCurrentlyOccupied) {
    status = 'occupied';
  } else if (!hasAvailableSlots) {
    status = 'occupied';
  } else if (hasFutureBookings) {
    status = 'reserved';
  }

  const statusClasses = {
    occupied: 'bg-red-100 border-red-300 cursor-not-allowed',
    reserved: 'bg-blue-100 border-blue-300 cursor-pointer relative',
    available: 'bg-green-100 border-green-300 hover:bg-green-200 cursor-pointer',
  };
  
  //console.log("🔄 Rendering TableIcon for table:", table._id, "Status:", status); 

  
   // Allow admins to select "occupied" tables
   const isAdmin = user?.role === 'admin';
   const isSelectable = isAdmin || status !== 'occupied';

   return (
    <div
      onClick={() => isSelectable && onSelect(table)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`p-3 rounded-lg border ${statusClasses[status]} ${
        isSelectable ? 'cursor-pointer' : 'cursor-not-allowed'
      }`}
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
              {bookings.filter((b) =>
                (b.tableId === table._id || b.table?.toString() === table._id.toString()) &&
                b.status !== 'cancelled'
              ).map((booking) => {
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


function checkIfTableHasAvailableSlots(table, allBookings, selectedDate) {
  const now = new Date();
  const availableSlots = [];
  const baseDate = new Date(selectedDate);

  for (let hour = 8; hour <= 23; hour++) {
    availableSlots.push(new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hour, 0));
    if (hour < 23) {
      availableSlots.push(new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hour, 30));
    }
  }

  if (!availableSlots.some(slot => slot.getHours() === 23 && slot.getMinutes() === 30)) {
    availableSlots.push(new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 30));
  }

  const tableBookings = allBookings.filter(
    booking => (booking.tableId === table._id || booking.table?.toString() === table._id.toString()) && booking.status !== 'cancelled'
  );

  const tableBookingsWithBuffers = tableBookings
    .map(booking => ({
      start: addMinutes(new Date(booking.startTime), -BUFFER_MINUTES),
      end: addMinutes(new Date(booking.endTime), BUFFER_MINUTES)
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  for (const startSlot of availableSlots) {
    if (isBefore(startSlot, now)) continue;

    const isStartSlotAvailable = !tableBookingsWithBuffers.some(booking =>
      startSlot >= booking.start && startSlot < booking.end
    );

    if (!isStartSlotAvailable) continue;

    const nextConflictingBooking = tableBookingsWithBuffers.find(booking =>
      booking.start > startSlot
    );

    const hasValidEndTimes = availableSlots.some(endSlot => {
      const minutes = differenceInMinutes(endSlot, startSlot);
      if (!isBefore(startSlot, endSlot) || minutes < MIN_BOOKING_MINUTES) return false;
      if (nextConflictingBooking && endSlot > nextConflictingBooking.start) return false;

      const isRangeValid = !tableBookingsWithBuffers.some(booking => (
        (startSlot >= booking.start && startSlot < booking.end) ||
        (endSlot > booking.start && endSlot <= booking.end) ||
        (startSlot <= booking.start && endSlot >= booking.end)
      ));

      return isRangeValid;
    });

    if (hasValidEndTimes) {
      return true;
    }
  }

  return false;
}

const TableGrid = ({ onSelect }) => {
  const {
    tables,
    bookings,
    selectedDate,
    fetchTables,
    fetchBookings,
    updateBookingCancelStatus,
    updateBookingCreate,
    updateEditedBooking,
    selectTable,
    selectedTable,
  } = useBookingStore();

  useEffect(() => {
    fetchTables();
    if (selectedDate) {
      fetchBookings(selectedDate);
    }
  }, [selectedDate]);

  //**Add real-time updates using Socket.IO : 

  // Listen for booking creation
  useEffect(() => {
    socket.on('booking:create', (newBooking) => {
      console.log("📥 Received booking:create event:", newBooking);
  
      // Add the new booking to the state
      updateBookingCreate(newBooking);
  
      // Optionally refetch tables if needed
      fetchTables();
    });
  
    return () => {
      socket.off('booking:create'); // Clean up listener
    };
  }, [updateBookingCreate, fetchTables]);
  

  // Listen for booking cancellation
  useEffect(() => {
    socket.on('booking:cancel', (cancelledBooking) => {
      console.log("📥 Received booking:cancel event:", cancelledBooking);
      updateBookingCancelStatus(cancelledBooking); // Update the booking in the store
      fetchTables(); // Ensure table availability updates
    });

    return () => {
      socket.off('booking:cancel'); // Clean up socket listeners on unmount
    };
  }, [updateBookingCancelStatus, fetchTables]);

  // Listen for booking updates emmited by admin edit booking
  useEffect(() => {
    
    socket.on('booking:update', (updatedBooking) => {
      console.log("📥 Received booking:update event:", updatedBooking);
  
      // Update the edited booking in the state
      updateEditedBooking(updatedBooking);
      fetchTables();
    });
  
    return () => {
      socket.off('booking:update'); // Clean up listener
    };
  }, [updateEditedBooking, fetchTables]);
  

  const getTableStatus = (tableId) => {
    const table = tables.find((t) => t._id === tableId);
    const hasSlots = checkIfTableHasAvailableSlots(table, bookings, selectedDate);
    if (!hasSlots) return 'fully-booked';

    const tableBookings = bookings.filter(
      (b) =>
        (b.tableId === tableId || b.table?._id === tableId) &&
        b.status !== 'cancelled'
    );
    if (tableBookings.length === 0) return 'free';
    return 'partially-booked';
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {tables.map((table) => (
        <TableIcon
          key={table._id}
          table={table}
          status={getTableStatus(table._id)}
          isSelected={selectedTable?._id === table._id}
          onSelect={() => {
            selectTable(table);
            onSelect?.(table);
          }}
        />
      ))}
    </div>
  );
};

export default TableGrid;
