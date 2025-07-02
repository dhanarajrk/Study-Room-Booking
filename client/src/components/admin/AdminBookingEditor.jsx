import useBookingStore from '../../store/bookingStore';
import { format } from 'date-fns';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import TimeSlotPicker from '../dashboard/TimeSlotPicker';
import { updateBooking, deleteBooking, cancelBooking } from '../../api/booking'; // ← add cancelBooking
import { fetchRefundStatus } from '../../api/booking.js';

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
    selectedDate,
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

  const handleRefreshRefundStatus = async (bookingId) => {
    try {
      const response = await fetchRefundStatus(bookingId);
      toast.success(`Refund status refreshed: ${response.refundStatus}`);
      // Optionally refetch bookings to update the UI
      fetchBookings(selectedDate);
    } catch (err) {
      toast.error('Failed to refresh refund status');
      console.error('Refund status refresh failed:', err.message);
    }
  };

  // //normal theme:
  // return (
  //   <div className="space-y-4">
  //     <h4 className="font-semibold text-lg mb-2">
  //       Bookings for Table {selectedTable.tableNumber}
  //     </h4>
  
  //     {tableBookings.length === 0 ? (
  //       <div className="text-sm text-gray-500">No bookings found for this table.</div>
  //     ) : (
  //       tableBookings.map((booking) => {
  //         const start = new Date(booking.startTime);
  //         const end = new Date(booking.endTime);
  //         const username = booking.user?.username || 'Unknown';
  
  //         return (
  //           <div
  //             key={booking._id}
  //             className={`p-3 border rounded space-y-1 flex justify-between items-center ${
  //               selectedSlot?._id === booking._id ? 'bg-blue-50' : 'bg-gray-50'
  //             }`}
  //           >
  //             <div>
  //               <div className="text-sm font-medium text-gray-800">
  //                 {format(start, 'p')} – {format(end, 'p')}
  //               </div>
  //               <div className="text-xs text-gray-600">Booked by: {username}</div>
  //             </div>
  //             <div className="flex flex-col items-end gap-1">
  //               <button
  //                 onClick={() => {
  //                   setSelectedSlot(booking);
  //                   setSelectedTime(start);
  //                   const mins = (end.getTime() - start.getTime()) / 60000;
  //                   setHours(Math.floor(mins / 60));
  //                   setMinutes(mins % 60);
  //                   setTotalAmount(0);
  //                 }}
  //                 className="text-sm text-blue-600 hover:underline"
  //               >
  //                 ✏️ Edit
  //               </button>
  
  //               {booking.status === 'cancelled' ? (
  //                 <div className="text-xs text-red-600 font-semibold text-right">
  //                   Cancelled — Refund: ${booking.refundAmount?.toFixed(2)} (
  //                   <span
  //                     className={
  //                       booking.refundStatus === 'SUCCESS'
  //                         ? 'text-green-500'
  //                         : 'text-red-600'
  //                     }
  //                   >
  //                     {booking.refundStatus}
  //                   </span>
  //                   )
  //                   <button
  //                     onClick={() => handleRefreshRefundStatus(booking._id)}
  //                     className="ml-2 text-blue-600 hover:underline text-xs"
  //                   >
  //                     Refresh Refund Status
  //                   </button>
  //                 </div>
  //               ) : (
  //                 <button
  //                   onClick={() => handleCancelSlot(booking._id)}
  //                   className="text-sm text-red-600 hover:underline"
  //                 >
  //                   🚫 Cancel Slot
  //                 </button>
  //               )}
  //             </div>
  //           </div>
  //         );
  //       })
  //     )}
  
  //     {selectedSlot && (
  //       <div className="space-y-2 pt-4 border-t">
  //         <h4 className="font-medium text-sm">Editing Slot</h4>
  //         <TimeSlotPicker isAdminView={true} />
  //         <div className="flex gap-2 pt-2">
  //           <button
  //             onClick={handleSaveChanges}
  //             className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
  //           >
  //             ✅ Save Changes
  //           </button>
  //           <button
  //             onClick={handleDeleteSlot}
  //             className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
  //           >
  //             🗑️ Delete Slot
  //           </button>
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );

  return (
    <div className="space-y-4 text-[var(--text)]">
      <h4 className="font-semibold text-lg mb-2">
        Bookings for Table {selectedTable.tableNumber}
      </h4>
  
      {tableBookings.length === 0 ? (
        <div className="text-sm text-[var(--text-muted)]">No bookings found for this table.</div>
      ) : (
        tableBookings.map((booking) => {
          const start = new Date(booking.startTime);
          const end = new Date(booking.endTime);
          const username = booking.manualBookedUser?.username || booking.user?.username || 'Unknown'; //it will store manual booked username if paid manually by admin, otherwise it will store the username that done online payment
  
          const isEditing = selectedSlot?._id === booking._id;
  
          return (
            <div key={booking._id} className="space-y-2">
              <div
                className={`p-3 rounded shadow-lg dark:shadow-[0px_4px_10px_rgba(255,255,255,0.1),0px_2px_4px_rgba(0,0,0,0.4)] space-y-1 flex justify-between items-center ${
                  isEditing ? 'bg-[var(--info)]/10' : 'bg-[var(--bg)]'
                }`}
              >
                <div>
                  <div className="text-sm font-medium">
                    {format(start, 'p')} – {format(end, 'p')}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">Booked by: {username}</div>
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
                    className="text-sm text-[var(--primary)] hover:underline"
                  >
                    ✏️ Edit
                  </button>
  
                  {booking.status === 'cancelled' ? (
                    <div className="text-xs text-[var(--danger)] font-semibold text-right">
                      Cancelled — Refund: ${booking.refundAmount?.toFixed(2)} (
                      <span
                        className={
                          booking.refundStatus === 'SUCCESS'
                            ? 'text-[var(--success)]'
                            : 'text-[var(--danger)]'
                        }
                      >
                        {booking.refundStatus}
                      </span>
                      )
                      <button
                        onClick={() => handleRefreshRefundStatus(booking._id)}
                        className="ml-2 px-2 py-1 rounded bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 text-xs"
                      >
                        Refresh Status
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCancelSlot(booking._id)}
                      className="px-2 py-1 rounded bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90 text-sm"
                    >
                      Cancel Slot
                    </button>
                  )}
                </div>
              </div>
  
              {/* Show Editing UI directly below the booking being edited */}
              {isEditing && (
                <div className="space-y-2 pt-3 border-t border-[var(--border)] mt-1">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-sm">Editing Slot</h4>
                    <button
                      onClick={() => setSelectedSlot(null)}
                      className="text-xs text-[var(--danger)] hover:underline"
                    >
                      ✕ Close
                    </button>
                  </div>
                  <TimeSlotPicker isAdminView={true} />
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSaveChanges}
                      className="bg-[var(--success)] text-white px-4 py-2 rounded hover:bg-[var(--success)]/90 text-sm"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleDeleteSlot}
                      className="bg-[var(--danger)] text-white px-4 py-2 rounded hover:bg-[var(--danger)]/90 text-sm"
                    >
                      Delete Slot
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
  
  
}
