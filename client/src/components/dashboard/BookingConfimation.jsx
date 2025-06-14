import { toast } from 'react-hot-toast';
import { format, addHours, addMinutes } from 'date-fns';
import useBookingStore from '../../store/bookingStore';
import useAuthStore from '../../store/authStore';

const DetailRow = ({ label, value, isTotal = false }) => (
  <div className={`flex justify-between ${isTotal ? 'font-bold text-lg' : ''}`}>
    <span className="text-gray-600">{label}:</span>
    <span className="text-gray-800">{value}</span>
  </div>
);

export default function BookingConfirmation() {
  const {
    selectedTable,
    selectedTime,
    selectedDate,
    hours,
    minutes,
    totalAmount,
    bookingModalOpen,
    isLoading,
    error,
    closeBookingModal,
    submitBooking
  } = useBookingStore();

  const { user } = useAuthStore();

  const handleConfirm = async () => {
    try {
      if (!user?._id) {
        toast.error('Please login to book a table');
        return;
      }

      if (!selectedTable?._id || !selectedTime) {
        toast.error('Incomplete booking information');
        return;
      }

      const startTime = selectedTime;
      const endTime = addMinutes(addHours(selectedTime, hours), minutes);

      await submitBooking(user._id);
      toast.success(`Table ${selectedTable.tableNumber} booked successfully!`);
      closeBookingModal();
    } catch (err) {
      toast.error(err.message || 'Booking failed');
    }
  };

  if (!bookingModalOpen || !selectedTable || !selectedTime) return null;

  const endTime = addMinutes(addHours(selectedTime, hours), minutes);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-lg">Confirm Booking</h3>
          <button
            onClick={closeBookingModal}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <DetailRow label="Table" value={`T${selectedTable.tableNumber}`} />
          <DetailRow label="Date" value={format(selectedDate, 'PPP')} />
          <DetailRow
            label="Time Slot"
            value={`${format(selectedTime, 'p')} - ${format(endTime, 'p')}`}
          />
          <DetailRow
            label="Duration"
            value={`${hours > 0 ? `${hours} hour${hours !== 1 ? 's' : ''}` : ''}
                   ${minutes > 0 ? `${hours > 0 ? ' ' : ''}${minutes} minute${minutes !== 1 ? 's' : ''}` : ''}`}
          />
          <DetailRow label="Total Amount" value={`$${totalAmount}`} isTotal />
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : 'Proceed Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}