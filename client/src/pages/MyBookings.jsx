import { useEffect, useRef, useState } from 'react';
import { format, isAfter } from 'date-fns';
import useBookingStore from '../store/bookingStore';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { fetchRefundStatus } from '../api/booking.js';

const MyBookings = () => {
  const { user } = useAuthStore();
  const { myBookings, fetchMyBookings, isLoading, cancelBooking } = useBookingStore();
  const [activeTab, setActiveTab] = useState('all'); // all | upcoming | cancelled
  const upcomingRefs = useRef([]);

  useEffect(() => {
    if (user?._id) fetchMyBookings(user._id);
  }, [user, fetchMyBookings]);

  useEffect(() => {
    const now = new Date();
    const index = myBookings.findIndex(
      (b) => b.status === 'confirmed' && isAfter(new Date(b.endTime), now)
    );
    if (index !== -1 && upcomingRefs.current[index]) {
      upcomingRefs.current[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [myBookings]);

  const handleRefreshRefundStatus = async (bookingId) => {
    try {
      const response = await fetchRefundStatus(bookingId);
      toast.success(`Refund status refreshed: ${response.refundStatus}`);
      // Optionally, refresh bookings to reflect the updated refund status
      fetchMyBookings(user._id);
    } catch (err) {
      toast.error('Failed to refresh refund status');
      console.error('Refund status refresh failed:', err.message);
    }
  };

  const handleCancel = async (bookingId) => {
    const confirm = window.confirm('Are you sure you want to cancel this booking?');
    if (!confirm) return;

    try {
      await cancelBooking(bookingId, user._id);
      toast.success('Booking cancelled successfully. Refund will be processed.');
    } catch (err) {
      toast.error('Failed to cancel booking');
    }
  };

  const now = new Date();

  const filteredBookings = myBookings.filter((b) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') return b.status === 'confirmed' && isAfter(new Date(b.endTime), now);
    if (activeTab === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  if (isLoading) return <div className="p-4">Loading your bookings...</div>;
  if (myBookings.length === 0) return <div className="p-4 text-gray-600">You have no bookings yet.</div>;


  // //normal theme:
  // return (
  //   <div className="p-4 max-w-4xl mx-auto">
  //     <h2 className="text-xl font-semibold mb-4">My Bookings</h2>

  //     {/* Tabs */}
  //     <div className="flex gap-2 mb-4">
  //       {['all', 'upcoming', 'cancelled'].map((tab) => (
  //         <button
  //           key={tab}
  //           onClick={() => setActiveTab(tab)}
  //           className={`px-4 py-1 rounded-full text-sm capitalize border transition ${activeTab === tab
  //             ? 'bg-blue-600 text-white border-blue-600'
  //             : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
  //             }`}
  //         >
  //           {tab}
  //         </button>
  //       ))}
  //     </div>

  //     {/* Bookings List */}
  //     <div className="max-h-[75vh] overflow-y-auto space-y-4 pr-2">
  //       {filteredBookings.map((booking, index) => {
  //         const isUpcoming = isAfter(new Date(booking.endTime), now);
  //         const isCancelled = booking.status === 'cancelled';

  //         return (
  //           <div
  //             key={booking._id}
  //             ref={(el) => (upcomingRefs.current[index] = el)}
  //             className={`p-4 rounded shadow border space-y-1 transition ${isCancelled
  //               ? 'bg-red-100 border-red-300 text-red-700'
  //               : isUpcoming
  //                 ? 'bg-green-50 border-green-400'
  //                 : 'bg-gray-100 border-gray-300'
  //               }`}
  //           >
  //             <div className="flex justify-between items-center mb-1">
  //               <div className="font-semibold">
  //                 Table T{booking.table?.tableNumber} — {format(new Date(booking.startTime), 'PPP')}
  //               </div>
  //               {!isCancelled && isUpcoming && (
  //                 <button
  //                   onClick={() => handleCancel(booking._id)}
  //                   className="text-red-600 hover:underline text-sm"
  //                 >
  //                   Cancel
  //                 </button>
  //               )}
  //             </div>

  //             <div className="text-sm">
  //               <div>
  //                 <strong>Time:</strong> {format(new Date(booking.startTime), 'p')} -{' '}
  //                 {format(new Date(booking.endTime), 'p')}
  //               </div>
  //               <div>
  //                 <strong>Total:</strong> ${booking.totalPrice.toFixed(2)}
  //               </div>
  //             </div>

  //             {isCancelled && (
  //               <div className="text-xs font-medium mt-1 text-red-600">
  //                 Cancelled — Refund: ${booking.refundAmount?.toFixed(2)} (
  //                 <span className={booking.refundStatus === 'SUCCESS' ? 'text-green-500' : 'text-red-600'}>
  //                   {booking.refundStatus}
  //                 </span>
  //                 )
  //                 <button
  //                   onClick={() => handleRefreshRefundStatus(booking._id)}
  //                   className="ml-2 text-blue-600 hover:underline text-xs"
  //                 >
  //                   Refresh Refund Status
  //                 </button>
  //               </div>
  //             )}

  //           </div>
  //         );
  //       })}
  //     </div>
  //   </div>
  // );

  return (
    <div className="p-4 max-w-4xl mx-auto bg-[var(--bg)] text-[var(--text)]">
      <h2 className="text-xl font-semibold mb-4">My Bookings</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'upcoming', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1 rounded-full text-sm capitalize border transition ${activeTab === tab
                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                : 'bg-[var(--bg-light)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--highlight)]'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="max-h-[75vh] overflow-y-auto space-y-4 pr-2">
        {filteredBookings.map((booking, index) => {
          const isUpcoming = isAfter(new Date(booking.endTime), now);
          const isCancelled = booking.status === 'cancelled';

          return (
            <div
              key={booking._id}
              ref={(el) => (upcomingRefs.current[index] = el)}
              className={`p-4 rounded shadow border space-y-2 transition ${isCancelled
                  ? 'bg-[var(--danger)]/10 border-[var(--danger)] text-[var(--danger)]'
                  : isUpcoming
                    ? 'bg-[var(--success)]/10 border-[var(--success)]'
                    : 'bg-[var(--bg-light)] border-[var(--border)]'
                }`}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="font-semibold">
                  Table T{booking.table?.tableNumber} — {format(new Date(booking.startTime), 'PPP')}
                </div>
                {!isCancelled && isUpcoming && (
                  <button
                    onClick={() => handleCancel(booking._id)}
                    className="px-3 py-1 text-sm rounded bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90 transition-colors"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>

              <div className="text-sm space-y-1">
                <div>
                  <strong>Time:</strong> {format(new Date(booking.startTime), 'p')} -{' '}
                  {format(new Date(booking.endTime), 'p')}
                </div>
                <div>
                  <strong>Total:</strong> ${booking.totalPrice.toFixed(2)}
                </div>
              </div>

              {/* Invoice Button */}
              <div className="mt-2">
                {booking.invoiceLink ? (
                  <a
                    href={booking.invoiceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <button
                      className="px-3 py-1 rounded bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-colors text-sm"
                    >
                      View Invoice
                    </button>
                  </a>
                ) : (
                  <button
                    disabled
                    className="px-3 py-1 rounded bg-gray-300 text-gray-600 cursor-not-allowed text-sm"
                  >
                    Invoice Expired
                  </button>
                )}
              </div>

              {/* Refund Info for Cancelled */}
              {isCancelled && (
                <div className="text-xs font-medium mt-1 text-[var(--danger)]">
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
                    className="ml-2 px-3 py-1 rounded bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-colors text-xs"
                  >
                    Refresh Refund Status
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

};

export default MyBookings;
