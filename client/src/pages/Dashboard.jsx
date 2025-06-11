import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TableGrid from '../components/dashboard/TableGrid';
import BookingPanel from '../components/dashboard/BookingPanel';
import useBookingStore from '../store/bookingStore';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { selectedDate, setDate, selectTable, fetchBookings } = useBookingStore();
  const navigate = useNavigate(); 

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Handle unauthenticated state (redirect to login)
      navigate('/login');
      return;
    }
    fetchBookings(selectedDate);
  }, [selectedDate, fetchBookings, navigate]);

  return (
    <div className="space-y-4 p-4">
      {/* Date Picker - Controls entire table view */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <label className="block text-sm font-medium mb-1">View tables for:</label>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setDate(date)}
          minDate={new Date()}
          className="border p-2 rounded"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Table Grid (Now shows availability for selectedDate) */}
        <div className="lg:w-3/4">
          <TableGrid onSelect={selectTable} />
        </div>

        {/* Booking Panel (Uses selectedDate implicitly) */}
        <div className="lg:w-1/4">
          <BookingPanel />
        </div>
      </div>
    </div>
  );
}