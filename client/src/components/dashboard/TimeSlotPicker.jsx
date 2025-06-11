import { useState, useEffect, useMemo } from 'react';
import { format, isBefore, differenceInMinutes, addMinutes } from 'date-fns';
import { toast } from 'react-hot-toast';
import useBookingStore from '../../store/bookingStore';

const HOURLY_RATE = 5;
const MIN_BOOKING_MINUTES = 30;
const BUFFER_MINUTES = 30;

const isTimeSlotAvailable = (slot, selectedTable, bookings) => {
  if (!selectedTable) return false;

  const now = new Date();
  if (isBefore(slot, now)) return false;

  return !bookings.some(booking => {
    if (booking.tableId !== selectedTable._id) return false;

    const bookingStart = new Date(booking.startTime);
    const bookingEnd = new Date(booking.endTime);

    const bufferedStart = new Date(bookingStart.getTime() - BUFFER_MINUTES * 60000);
    const bufferedEnd = new Date(bookingEnd.getTime() + BUFFER_MINUTES * 60000);

    return slot >= bufferedStart && slot < bufferedEnd;
  });
};

export default function TimeSlotPicker() {
  const {
    selectedDate,
    bookings,
    selectedTable,
    setSelectedTime,
    setHours,
    setMinutes,
    setTotalAmount
  } = useBookingStore();

  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    const slots = [];
    const baseDate = new Date(selectedDate);

    for (let hour = 8; hour <= 23; hour++) {
      slots.push(new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hour, 0));
      if (hour < 23) {
        slots.push(new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hour, 30));
      }
    }

    if (!slots.some(slot => slot.getHours() === 23 && slot.getMinutes() === 30)) {
      slots.push(new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 30));
    }

    setAvailableSlots(slots);
  }, [selectedDate]);

  const tableBookingsWithBuffers = useMemo(() => {
    if (!selectedTable) return [];

    return bookings
      .filter(booking => booking.table?.toString() === selectedTable._id.toString())
      .map(booking => ({
        start: addMinutes(new Date(booking.startTime), -BUFFER_MINUTES),
        end: addMinutes(new Date(booking.endTime), BUFFER_MINUTES)
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime()); // Sort by start time
  }, [bookings, selectedTable]);

  const isSlotAvailable = (slot) => {
    if (!selectedTable) return false;

    const now = new Date();
    if (isBefore(slot, now)) return false;

    return !bookings.some(booking => {
      if (booking.table?.toString() !== selectedTable._id.toString()) return false;

      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      const bufferedStart = new Date(bookingStart.getTime() - BUFFER_MINUTES * 60000);
      const bufferedEnd = new Date(bookingEnd.getTime() + BUFFER_MINUTES * 60000);

      return slot >= bufferedStart && slot < bufferedEnd;
    });
  };

  const getAvailableEndTimes = () => {
    if (!startTime) return [];

    const endSlots = [];
    
    // Find the next booking that would conflict with our proposed time range
    const nextConflictingBooking = tableBookingsWithBuffers.find(booking => 
      booking.start > startTime
    );

    for (const slot of availableSlots) {
      const minutes = differenceInMinutes(slot, startTime);
      
      // Skip if slot is not after start time or doesn't meet minimum duration
      if (!isBefore(startTime, slot) || minutes < MIN_BOOKING_MINUTES) continue;

      // If there's a next booking, make sure our end time doesn't go into its buffer zone
      if (nextConflictingBooking && slot > nextConflictingBooking.start) {
        break; // Stop here - we can't book beyond this point
      }

      // Double-check: ensure the entire time range (startTime to slot) is available
      const isRangeValid = !tableBookingsWithBuffers.some(booking => {
        // Check if any part of our proposed booking overlaps with existing bookings
        return (
          (startTime >= booking.start && startTime < booking.end) || // start overlaps
          (slot > booking.start && slot <= booking.end) ||           // end overlaps
          (startTime <= booking.start && slot >= booking.end)        // fully encompasses
        );
      });

      if (!isRangeValid) {
        break; // Stop at first invalid slot
      }

      endSlots.push(slot);
    }

    return endSlots;
  };

  useEffect(() => {
    if (startTime && endTime) {
      const minutes = differenceInMinutes(endTime, startTime);
      const hoursDecimal = minutes / 60;
      const total = (hoursDecimal * HOURLY_RATE).toFixed(2);

      setHours(Math.floor(hoursDecimal));
      setMinutes(minutes % 60);
      setSelectedTime(startTime);
      setTotalAmount(total);
    }
  }, [startTime, endTime, setHours, setMinutes, setSelectedTime, setTotalAmount]);

  const handleStartTimeChange = (e) => {
    if (!selectedTable) {
      toast.error('Please select a table first');
      return;
    }

    const time = e.target.value ? new Date(e.target.value) : null;
    setStartTime(time);
    setEndTime(null); // Reset end time when start time changes
  };

  const handleEndTimeChange = (e) => {
    const time = e.target.value ? new Date(e.target.value) : null;
    setEndTime(time);
  };

  return (
    <div className="space-y-4">
      {!selectedTable && (
        <div className="p-3 bg-yellow-50 text-yellow-800 rounded text-sm">
          Please select a table to book time slots
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Start Time</label>
        <select
          value={startTime?.toString() || ''}
          onChange={handleStartTimeChange}
          disabled={!selectedTable}
          className={`w-full p-2 border rounded ${!selectedTable ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        >
          <option value="">Select start time</option>
          {availableSlots.map((slot) => {
            const isAvailable = isTimeSlotAvailable(slot, selectedTable, bookings);
            return (
              <option
                key={slot.toString()}
                value={slot.toString()}
                disabled={!isAvailable}
                className={!isAvailable ? 'text-gray-400 bg-red-100' : ''}
              >
                {format(slot, 'h:mm a')} {!isAvailable ? '❌ Booked' : '✅'}
              </option>
            );
          })}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">End Time</label>
        <select
          value={endTime?.toString() || ''}
          onChange={handleEndTimeChange}
          disabled={!startTime}
          className={`w-full p-2 border rounded ${!startTime ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        >
          <option value="">Select end time</option>
          {getAvailableEndTimes().map((slot) => (
            <option
              key={slot.toString()}
              value={slot.toString()}
            >
              {format(slot, 'h:mm a')} ✅
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}