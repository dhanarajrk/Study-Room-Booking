import useBookingStore from '../../store/bookingStore';
import { format } from 'date-fns';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import TimeSlotPicker from '../dashboard/TimeSlotPicker';
import { updateBooking, deleteBooking, cancelBooking } from '../../api/booking'; // ← add cancelBooking

export default function AdminBookingEditor() {
  const {
    selectedTable,
    bookings,
    setSelectedTime,
    setHours,
    setMinutes,
    setTotalAmount,
    selectedTime,
    hours,
    minutes,
    fetchBookings,
    selectedDate
  } = useBookingStore();

  const [selectedSlot, setSelectedSlot] = useState(null);

  if (!selectedTable) {
    return <div className="text-sm text-gray-500 p-2">Select a table to view bookings.</div>;
  }

  const tableBookings = bookings.filter(
    booking =>
      booking.tableId === selectedTable._id ||
      booking.table?.toString() === selectedTable._id.toString()
  );

  const handleSaveChanges = async () => {
    if (!selectedSlot || !selectedTime || (hours === 0 && minutes === 0)) {
      toast.error('Please select valid time changes');
      return;
    }

    const newEndTime = new Date(selectedTime.getTime() + (hours * 60 + minutes) * 60000);

    try {
      await updateBooking(
        selectedSlot._id,
        selectedTime.toISOString(),
        newEndTime.toISOString()
      );

      toast.success('Booking updated successfully!');
      setSelectedSlot(null);
      fetchBookings(selectedDate);
    } catch (err) {
      console.error('Update failed:', err);
      toast.error('Failed to update booking');
    }
  };

  const handleDeleteSlot = async () => {
    if (!selectedSlot) return;

    try {
      await deleteBooking(selectedSlot._id);
      toast.success('Booking deleted successfully!');
      setSelectedSlot(null);
      fetchBookings(selectedDate);
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete booking');
    }
  };

  const handleCancelSlot = async (bookingId) => {
    const confirm = window.confirm('Are you sure you want to cancel this booking?');
    if (!confirm) return;

    try {
      await cancelBooking(bookingId); // use admin cancel logic
      toast.success('Booking cancelled successfully');
      fetchBookings(selectedDate);
    } catch (err) {
      console.error('Cancel failed:', err);
      toast.error('Failed to cancel booking');
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-lg mb-2">
        Bookings for Table {selectedTable.tableNumber}
      </h4>

      {tableBookings.length === 0 ? (
        <div className="text-sm text-gray-500">No bookings found for this table.</div>
      ) : (
        tableBookings.map((booking) => {
          const start = new Date(booking.startTime);
          const end = new Date(booking.endTime);
          const username = booking.user?.username || 'Unknown';

          return (
            <div
              key={booking._id}
              className={`p-3 border rounded space-y-1 flex justify-between items-center ${selectedSlot?._id === booking._id ? 'bg-blue-50' : 'bg-gray-50'
                }`}
            >
              <div>
                <div className="text-sm font-medium text-gray-800">
                  {format(start, 'p')} – {format(end, 'p')}
                </div>
                <div className="text-xs text-gray-600">Booked by: {username}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={() => {
                    setSelectedSlot(booking);
                    setSelectedTime(start);
                    const mins = (end.getTime() - start.getTime()) / 60000;
                    setHours(Math.floor(mins / 60));
                    setMinutes(mins % 60);
                    setTotalAmount(0);
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  ✏️ Edit
                </button>
                
                {booking.status === 'cancelled' ? (
                  <div className="text-xs text-red-600 font-semibold text-right">
                    Cancelled — Refund: ${booking.refundAmount?.toFixed(2)} ({booking.refundStatus})
                  </div>
                ) : (
                  <button
                    onClick={() => handleCancelSlot(booking._id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    🚫 Cancel Slot
                  </button>
                )}

              </div>
            </div>
          );
        })
      )}

      {selectedSlot && (
        <div className="space-y-2 pt-4 border-t">
          <h4 className="font-medium text-sm">Editing Slot</h4>
          <TimeSlotPicker isAdminView={true} />
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSaveChanges}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
            >
              ✅ Save Changes
            </button>
            <button
              onClick={handleDeleteSlot}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
            >
              🗑️ Delete Slot
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
