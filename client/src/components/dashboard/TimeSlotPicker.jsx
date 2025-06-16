import { useState, useEffect, useMemo } from 'react';
import { format, isBefore, differenceInMinutes, addMinutes, isValid } from 'date-fns';
import { toast } from 'react-hot-toast';
import useBookingStore from '../../store/bookingStore';

const HOURLY_RATE = 5;
const MIN_BOOKING_MINUTES = 30;
const BUFFER_MINUTES = 30;

// Helper function to safely format dates
const safeFormat = (date, formatString) => {
  if (!date || !isValid(date)) {
    console.warn('Invalid date passed to format:', date);
    return 'Invalid Date';
  }
  try {
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return 'Invalid Date';
  }
};

// Helper function to safely create date
const safeCreateDate = (year, month, date, hours, minutes = 0) => {
  try {
    const newDate = new Date(year, month, date, hours, minutes);
    return isValid(newDate) ? newDate : null;
  } catch (error) {
    console.error('Error creating date:', error);
    return null;
  }
};


const isTimeSlotAvailable = (slot, selectedTable, bookings) => {
  if (!selectedTable || !slot || !isValid(slot)) return false;

  const now = new Date();
  if (isBefore(slot, now)) return false;

  return !bookings.some(booking => {
    if (
      (booking.tableId !== selectedTable._id && booking.table?.toString() !== selectedTable._id.toString()) ||
      booking?.status === 'cancelled' // ignore cancelled
    ) return false;

    const bookingStart = new Date(booking.startTime);
    const bookingEnd = new Date(booking.endTime);

    if (!isValid(bookingStart) || !isValid(bookingEnd)) return false;

    const bufferedStart = new Date(bookingStart.getTime() - BUFFER_MINUTES * 60000);
    const bufferedEnd = new Date(bookingEnd.getTime() + BUFFER_MINUTES * 60000);

    return slot >= bufferedStart && slot < bufferedEnd;
  });
};


export default function TimeSlotPicker({ readOnly = false, isAdminView = false }) {
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
    if (!selectedDate) return;

    const slots = [];
    const baseDate = new Date(selectedDate);

    // Validate base date
    if (!isValid(baseDate)) {
      console.error('Invalid selectedDate:', selectedDate);
      return;
    }

    for (let hour = 8; hour <= 23; hour++) {
      // Create 30-minute intervals
      const hourSlot = safeCreateDate(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        hour,
        0
      );

      if (hourSlot) slots.push(hourSlot);

      if (hour < 23) {
        const halfHourSlot = safeCreateDate(
          baseDate.getFullYear(),
          baseDate.getMonth(),
          baseDate.getDate(),
          hour,
          30
        );

        if (halfHourSlot) slots.push(halfHourSlot);
      }
    }

    // Add final 23:30 slot if not already present
    const finalSlot = safeCreateDate(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      23,
      30
    );

    if (finalSlot && !slots.some(slot =>
      slot.getHours() === 23 && slot.getMinutes() === 30
    )) {
      slots.push(finalSlot);
    }

    // Filter out any null/invalid slots
    const validSlots = slots.filter(slot => slot && isValid(slot));
    setAvailableSlots(validSlots);
  }, [selectedDate]);

  const tableBookingsWithBuffers = useMemo(() => {
    if (!selectedTable) return [];

    return bookings
      .filter(booking =>
        (booking.tableId === selectedTable._id || booking.table?.toString() === selectedTable._id.toString()) &&
        booking?.status !== 'cancelled' // exclude cancelled bookings
      )
      .map(booking => {
        const startDate = new Date(booking.startTime);
        const endDate = new Date(booking.endTime);

        // Only include valid bookings
        if (!isValid(startDate) || !isValid(endDate)) return null;

        return {
          start: addMinutes(startDate, -BUFFER_MINUTES),
          end: addMinutes(endDate, BUFFER_MINUTES),
          originalStart: startDate,
          originalEnd: endDate
        };
      })
      .filter(booking => booking !== null) // Remove invalid bookings
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [bookings, selectedTable]);


  const getAvailableEndTimes = (isAdminView = false) => {
    if (!startTime || !isValid(startTime)) return [];

    const endSlots = [];

    // For admin view, we'll show ALL possible end times
    if (isAdminView) {
      for (const slot of availableSlots) {
        // Validate slot before processing
        if (!slot || !isValid(slot)) continue;

        const minutes = differenceInMinutes(slot, startTime);

        // Only check minimum duration and that it's after start time
        if (!isBefore(startTime, slot) || minutes < MIN_BOOKING_MINUTES) continue;

        // Check if this slot would conflict with existing bookings (for display purposes)
        const isRangeValid = !tableBookingsWithBuffers.some(booking => {
          return (
            (startTime >= booking.start && startTime < booking.end) ||
            (slot > booking.start && slot <= booking.end) ||
            (startTime <= booking.start && slot >= booking.end)
          );
        });

        // For admin, add ALL valid time slots regardless of conflicts
        endSlots.push({ slot, isValid: isRangeValid });
      }
    } else {
      // Original logic for non-admin users
      const nextConflictingBooking = tableBookingsWithBuffers.find(booking =>
        booking.start > startTime
      );

      for (const slot of availableSlots) {
        // Validate slot before processing
        if (!slot || !isValid(slot)) continue;

        const minutes = differenceInMinutes(slot, startTime);

        if (!isBefore(startTime, slot) || minutes < MIN_BOOKING_MINUTES) continue;

        if (nextConflictingBooking && slot > nextConflictingBooking.start) {
          break;
        }

        const isRangeValid = !tableBookingsWithBuffers.some(booking => {
          return (
            (startTime >= booking.start && startTime < booking.end) ||
            (slot > booking.start && slot <= booking.end) ||
            (startTime <= booking.start && slot >= booking.end)
          );
        });

        if (!isRangeValid) {
          break;
        }

        endSlots.push({ slot, isValid: isRangeValid });
      }
    }

    return endSlots;
  };

  useEffect(() => {
    if (startTime && endTime && isValid(startTime) && isValid(endTime)) {
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

    if (!e.target.value) {
      setStartTime(null);
      setEndTime(null);
      return;
    }

    try {
      const time = new Date(e.target.value);
      if (isValid(time)) {
        setStartTime(time);
        setEndTime(null);
      } else {
        console.error('Invalid date from input:', e.target.value);
        toast.error('Invalid time selected');
      }
    } catch (error) {
      console.error('Error parsing date:', error);
      toast.error('Invalid time selected');
    }
  };

  const handleEndTimeChange = (e) => {
    if (!e.target.value) {
      setEndTime(null);
      return;
    }

    try {
      const time = new Date(e.target.value);
      if (isValid(time)) {
        setEndTime(time);
      } else {
        console.error('Invalid end date from input:', e.target.value);
        toast.error('Invalid end time selected');
      }
    } catch (error) {
      console.error('Error parsing end date:', error);
      toast.error('Invalid end time selected');
    }
  };

  return (
    <div className="space-y-4">
      {!selectedTable && (
        <div className="p-3 bg-yellow-50 text-yellow-800 rounded text-sm">
          Please select a table to book time slots
        </div>
      )}

      {/* Debug info */}
      {!readOnly && (
        <>
          {selectedTable && bookings.length > 0 && (
            <div className="p-3 bg-blue-50 text-blue-800 rounded text-sm">
              <strong className="block mb-2">Debug - Current Bookings for Table {selectedTable.tableNumber}:</strong>
              <div className="max-h-24 overflow-y-auto bg-white bg-opacity-50 rounded p-2 space-y-1">
                {bookings
                  .filter(booking =>
                    (booking.tableId === selectedTable._id || booking.table?.toString() === selectedTable._id.toString()) &&
                    booking.status !== 'cancelled'
                  )
                  .map((booking, index) => {
                    const start = new Date(booking.startTime);
                    const end = new Date(booking.endTime);

                    if (!isValid(start) || !isValid(end)) {
                      return (
                        <div key={index} className="text-xs text-red-600">
                          Invalid booking data
                        </div>
                      );
                    }

                    const bufferedStart = new Date(start.getTime() - BUFFER_MINUTES * 60000);
                    const bufferedEnd = new Date(end.getTime() + BUFFER_MINUTES * 60000);

                    return (
                      <div key={index} className="text-xs">
                        <div className="font-medium">
                          Booking: {safeFormat(start, 'h:mm a')} - {safeFormat(end, 'h:mm a')}
                        </div>
                        <div className="text-blue-600">
                          Buffer: {safeFormat(bufferedStart, 'h:mm a')} - {safeFormat(bufferedEnd, 'h:mm a')}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Start Time</label>
        <select
          value={startTime && isValid(startTime) ? startTime.toISOString() : ''}
          onChange={handleStartTimeChange}
          disabled={!selectedTable || readOnly}
          className={`w-full p-2 border rounded ${!selectedTable ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        >
          <option value="">Select start time</option>
          {availableSlots.map((slot, index) => {
            if (!slot || !isValid(slot)) return null;

            const isAvailable = isTimeSlotAvailable(slot, selectedTable, bookings);
            return (
              <option
                key={`${slot.toISOString()}-${index}`}
                value={slot.toISOString()}
                disabled={!isAvailable && !isAdminView}
                className={!isAvailable ? 'text-gray-400 bg-red-100' : ''}
              >
                {safeFormat(slot, 'h:mm a')} {!isAvailable ? '❌ Booked' : '✅'}
              </option>
            );
          })}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">End Time</label>
        <select
          value={endTime && isValid(endTime) ? endTime.toISOString() : ''}
          onChange={handleEndTimeChange}
          disabled={!startTime || readOnly}
          className={`w-full p-2 border rounded ${!startTime ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        >
          <option value="">Select end time</option>
          {getAvailableEndTimes(isAdminView).map(({ slot, isValid: slotIsValid }, i) => {
            if (!slot || !isValid(slot)) return null;

            return (
              <option
                key={`${slot.toISOString()}-${i}`}
                value={slot.toISOString()}
                disabled={false} // Admin can select any time slot
                className={!slotIsValid && !isAdminView ? 'text-gray-400 bg-red-100' :
                  !slotIsValid && isAdminView ? 'text-orange-600 bg-orange-100' : ''}
              >
                {safeFormat(slot, 'h:mm a')} {
                  isAdminView ?
                    (slotIsValid ? '✅' : '⚠️ Conflicts') :
                    (slotIsValid ? '✅' : '❌')
                }
              </option>
            );
          })}
        </select>
      </div>

      {/* Additional debug info for end times */}
      {startTime && selectedTable && isValid(startTime) && (
        <div className="p-3 bg-green-50 text-green-800 rounded text-sm">
          <strong>Debug - End Time Analysis for {safeFormat(startTime, 'h:mm a')}:</strong>
          <div className="text-xs mt-1 space-y-1">
            {!isAdminView && (
              <>
                <div>Next booking buffer starts at: {
                  tableBookingsWithBuffers.find(booking => booking.start > startTime)
                    ? safeFormat(tableBookingsWithBuffers.find(booking => booking.start > startTime).start, 'h:mm a')
                    : 'None'
                }</div>
              </>
            )}
            <div>Available end slots: {getAvailableEndTimes(isAdminView).length}</div>
            <div>End slots: {getAvailableEndTimes(isAdminView).map(({ slot }) => safeFormat(slot, 'h:mm a')).join(', ')}</div>
            {isAdminView && (
              <div className="text-orange-600 font-medium">
                ⚠️ Admin Mode: All time slots are selectable, including conflicting ones
              </div>
            )}
            <div className="font-semibold">Booking validations:</div>
            {availableSlots.filter(slot => {
              if (!slot || !isValid(slot)) return false;
              const minutes = differenceInMinutes(slot, startTime);
              return isBefore(startTime, slot) && minutes >= MIN_BOOKING_MINUTES;
            }).slice(0, 5).map(slot => {
              const nextBooking = tableBookingsWithBuffers.find(booking => booking.start > startTime);
              const wouldExceedNext = nextBooking && slot > nextBooking.start;
              const wouldOverlap = tableBookingsWithBuffers.some(booking => {
                return (
                  (startTime >= booking.start && startTime < booking.end) ||
                  (slot > booking.start && slot <= booking.end) ||
                  (startTime <= booking.start && slot >= booking.end)
                );
              });

              return (
                <div key={slot.toISOString()} className="ml-2 text-xs">
                  {safeFormat(slot, 'h:mm a')}:
                  {wouldExceedNext && ' ❌ Exceeds next booking'}
                  {wouldOverlap && ' ❌ Overlaps with booking'}
                  {!wouldExceedNext && !wouldOverlap && ' ✅ Valid'}
                  {isAdminView && (wouldExceedNext || wouldOverlap) && ' (Admin can override)'}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}