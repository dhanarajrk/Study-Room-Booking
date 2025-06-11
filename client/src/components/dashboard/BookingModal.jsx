import { format, addHours, addMinutes } from 'date-fns';
import { toast } from 'react-hot-toast';
import useBookingStore from '../../store/bookingStore';
import useAuthStore from '../../store/authStore';

export default function BookingModal({ onClose }) {
  const { 
    selectedTable, 
    selectedDate, 
    selectedTime, 
    hours, 
    minutes,
    submitBooking,
    isLoading,
    error
  } = useBookingStore();

  const { user } = useAuthStore();
  
  const handleConfirm = async () => {
    if (!selectedTable) {
      toast.error('Please select a table');
      return;
    }
    if (!selectedTime) {
      toast.error('Please select a time slot');
      return;
    }

    try {
      //debug log
      console.log('Submitting booking:', {
        tableId: selectedTable._id,
        tableNumber: selectedTable.tableNumber,
        userId: user._id,
        startTime: selectedTime.toISOString(),
        endTime: endTime.toISOString()
      });
      

      await submitBooking(user._id);
      if (!error) {
        toast.success('Booking confirmed!');
        onClose();
      }
    } catch (err) {
      toast.error(err.message || 'Booking failed');
    }
  };

  if (!selectedTable || !selectedTime) return null;

  const endTime = addMinutes(addHours(selectedTime, hours), minutes);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h3 className="font-bold text-lg mb-4">Confirm Booking</h3>
        
        <div className="space-y-2">
          <p><span className="font-medium">Table:</span> T{selectedTable.tableNumber}</p>
          <p><span className="font-medium">Date:</span> {format(selectedDate, 'PPP')}</p>
          <p>
            <span className="font-medium">Time:</span> {format(selectedTime, 'p')} - {format(endTime, 'p')}
          </p>
          <p>
            <span className="font-medium">Duration:</span> 
            {hours > 0 && `${hours} hour${hours !== 1 ? 's' : ''}`}
            {minutes > 0 && `${hours > 0 ? ' ' : ''}${minutes} minute${minutes !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 ${
              isLoading ? 'cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
        
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
      </div>
    </div>
  );
}