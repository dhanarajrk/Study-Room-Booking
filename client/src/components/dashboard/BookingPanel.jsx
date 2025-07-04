import { toast } from 'react-hot-toast';
import useBookingStore from '../../store/bookingStore';
import TimeSlotPicker from './TimeSlotPicker';
import BookingConfirmation from './BookingConfimation';
import { useEffect } from 'react';

export default function BookingPanel() {
  const {
    selectedTable,
    selectedDate,
    bookingModalOpen,
    selectedTime,
    hours,
    minutes,
    totalAmount,
    openBookingModal,
    closeBookingModal
  } = useBookingStore();

  useEffect(() => {
    console.log('Modal opened because:', {
      bookingModalOpen,
      selectedTime,
      fromStore: useBookingStore.getState().bookingModalOpen
    });
  }, [bookingModalOpen]);

  const handleConfirmBooking = () => {
    if (!selectedTable) {
      toast.error('Please select a table first');
      return;
    }
    if (!selectedTime) {
      toast.error('Please select both start and end times');
      return;
    }
    if (hours === 0 && minutes === 0) {
      toast.error('Please select a valid duration');
      return;
    }

    // Only open modal when explicitly called
    openBookingModal();
  };

  // // Normal Theme:
  // return (
  //   <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
  //     <h3 className="font-bold">
  //       {selectedTable ? `Book Table ${selectedTable.tableNumber}` : 'Select a Table'}
  //     </h3>

  //     {selectedDate && (
  //       <p className="text-sm text-gray-600">
  //         {selectedDate.toLocaleDateString('en-US', {
  //           weekday: 'long',
  //           month: 'long',
  //           day: 'numeric'
  //         })}
  //       </p>
  //     )}

  //     <TimeSlotPicker />

  //     {/* Booking Summary */}
  //     {selectedTime && (
  //       <div className="space-y-2 pt-2 border-t mt-4">
  //         <div className="flex justify-between">
  //           <span className="font-medium">Time Slot:</span>
  //           <span>
  //             {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
  //             {new Date(
  //               selectedTime.getTime() +
  //               hours * 60 * 60 * 1000 +
  //               minutes * 60 * 1000
  //             ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
  //           </span>
  //         </div>
  //         <div className="flex justify-between">
  //           <span className="font-medium">Duration:</span>
  //           <span>
  //             {hours > 0 && `${hours} hour${hours !== 1 ? 's' : ''}`}
  //             {minutes > 0 && ` ${minutes} minute${minutes !== 1 ? 's' : ''}`}
  //           </span>
  //         </div>
  //         <div className="flex justify-between font-bold text-lg">
  //           <span>Total:</span>
  //           <span>₹{totalAmount}</span>
  //         </div>
  //       </div>
  //     )}

  //     <button
  //       onClick={handleConfirmBooking}
  //       disabled={!selectedTime}
  //       className={`w-full py-3 mt-4 rounded-lg text-lg ${!selectedTime
  //           ? 'bg-gray-300 cursor-not-allowed'
  //           : 'bg-blue-600 hover:bg-blue-700 text-white'
  //         }`}
  //     >
  //       Confirm Booking
  //     </button>

  //     {/* Modal will only show when bookingModalOpen is true */}
  //     {bookingModalOpen && <BookingConfirmation onClose={closeBookingModal} />}
  //   </div>
  // );

  return (
    <div className="bg-[var(--bg-light)] p-4 rounded-lg shadow-md space-y-4 border border-[var(--border)] transition-colors duration-200">
      <h3 className="font-bold text-[var(--text)]">
        {selectedTable ? `Book Table ${selectedTable.tableNumber}` : 'Select a Table'}
      </h3>

      {selectedDate && (
        <p className="text-sm text-[var(--text-muted)]">
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      )}

      <TimeSlotPicker />

      {/* Booking Summary */}
      {selectedTime && (
        <div className="space-y-2 pt-2 border-t border-[var(--border-muted)] mt-4">
          <div className="flex justify-between text-[var(--text)]">
            <span className="font-medium">Time Slot:</span>
            <span>
              {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
              {new Date(
                selectedTime.getTime() +
                hours * 60 * 60 * 1000 +
                minutes * 60 * 1000
              ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex justify-between text-[var(--text)]">
            <span className="font-medium">Duration:</span>
            <span>
              {hours > 0 && `${hours} hour${hours !== 1 ? 's' : ''}`}
              {minutes > 0 && ` ${minutes} minute${minutes !== 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="flex justify-between font-bold text-lg text-[var(--text)]">
            <span>Total:</span>
            <span>₹{totalAmount}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleConfirmBooking}
        disabled={!selectedTime}
        className={`w-full py-3 mt-4 rounded-lg text-lg transition-colors duration-200 ${!selectedTime
            ? 'bg-[var(--text-muted)] cursor-not-allowed text-[var(--text)]'
            : 'bg-[var(--primary)] hover:opacity-90 text-white'
          }`}
      >
        Confirm Booking
      </button>

      {/* Modal will only show when bookingModalOpen is true */}
      {bookingModalOpen && <BookingConfirmation onClose={closeBookingModal} />}
    </div>
  );

}