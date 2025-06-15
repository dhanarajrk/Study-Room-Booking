import { useEffect, useRef, useState } from 'react';
import { format, isAfter } from 'date-fns';
import useBookingStore from '../store/bookingStore';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

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

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">My Bookings</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'upcoming', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1 rounded-full text-sm capitalize border transition ${
              activeTab === tab
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
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
              className={`p-4 rounded shadow border space-y-1 transition ${
                isCancelled
                  ? 'bg-red-100 border-red-300 text-red-700'
                  : isUpcoming
                  ? 'bg-green-50 border-green-400'
                  : 'bg-gray-100 border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="font-semibold">
                  Table T{booking.table?.tableNumber} — {format(new Date(booking.startTime), 'PPP')}
                </div>
                {!isCancelled && isUpcoming && (
                  <button
                    onClick={() => handleCancel(booking._id)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="text-sm">
                <div>
                  <strong>Time:</strong> {format(new Date(booking.startTime), 'p')} -{' '}
                  {format(new Date(booking.endTime), 'p')}
                </div>
                <div>
                  <strong>Total:</strong> ${booking.totalPrice.toFixed(2)}
                </div>
              </div>

              {isCancelled && (
                <div className="text-xs text-red-600 font-medium mt-1">
                  Cancelled — Refund: ${booking.refundAmount?.toFixed(2)} ({booking.refundStatus})
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
