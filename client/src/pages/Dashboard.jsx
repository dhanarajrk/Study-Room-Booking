import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TableGrid from '../components/dashboard/TableGrid';
import BookingPanel from '../components/dashboard/BookingPanel';
import useBookingStore from '../store/bookingStore';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import AdminBookingEditor from '../components/admin/AdminBookingEditor';

export default function Dashboard() {
  const { selectedDate, setDate, selectTable, fetchBookings } = useBookingStore();
  const navigate = useNavigate();
  const { user } = useAuthStore(); // to check is logged in user role is admin/customer 

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Handle unauthenticated state (redirect to login)
      navigate('/login');
      return;
    }
    fetchBookings(selectedDate);
  }, [selectedDate, fetchBookings, navigate]);

 
  //Normal theme:
  // return (
  //   <div className="space-y-4 p-4">
  //     {/* Date Picker */}
  //     <div className="bg-white p-4 rounded-lg shadow-sm">
  //       <label className="block text-sm font-medium mb-1">View tables for:</label>
  //       <DatePicker
  //         selected={selectedDate}
  //         onChange={(date) => setDate(date)}
  //         minDate={new Date()}
  //         className="border p-2 rounded"
  //       />
  //     </div>

  //     {/* Conditional layout based on user role */}
  //     {user?.role === 'admin' ? (
  //       // Admin Layout (25% + 50% + 25%)
  //       <div className="flex flex-col lg:flex-row gap-8">
  //         <div className="lg:w-1/4">
  //           <TableGrid onSelect={selectTable} />
  //         </div>

  //         <div className="lg:w-2/4">
  //           <div className="bg-white p-4 rounded-lg shadow-md h-[600px] max-h-[80vh] overflow-y-auto">
  //             <h3 className="font-bold text-lg">Admin Controls</h3>
  //             <AdminBookingEditor />
  //           </div>
  //         </div>

  //         <div className="lg:w-1/4">
  //           <BookingPanel />
  //         </div>
  //       </div>
  //     ) : (
  //       // Normal User Layout (75% + 25%)
  //       <div className="flex flex-col lg:flex-row gap-8">
  //         <div className="lg:w-3/4">
  //           <TableGrid onSelect={selectTable} />
  //         </div>

  //         <div className="lg:w-1/4">
  //           <BookingPanel />
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );

  return (
    <div className="space-y-4 p-4 bg-[var(--bg)]" >
      
      {/* Date Picker */}
      <div className="bg-[var(--bg-light)] p-4 rounded-lg shadow-sm border border-[var(--border)] transition-colors duration-200">
        <label className="block text-sm font-medium mb-1 text-[var(--text)]">
          View tables for:
        </label>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setDate(date)}
          minDate={new Date()}
          className="border border-[var(--border)] shadow-lg p-2 rounded bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)]"
          calendarClassName="bg-[var(--bg-light)] border border-[var(--border)] text-[var(--text)]"
          dayClassName={(date) => 
            `text-[var(--text)] hover:bg-[var(--highlight)]`
          }
        />
      </div>

      {/* Conditional layout based on user role */}
      {user?.role === 'admin' ? (
        // Admin Layout (25% + 50% + 25%)
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4">
            <TableGrid onSelect={selectTable} />
          </div>

          <div className="lg:w-2/4">
            <div className="bg-[var(--bg-light)] p-4 rounded-lg shadow-md border border-[var(--border)] h-[600px] max-h-[80vh] overflow-y-auto">
              <h3 className="font-bold text-lg text-[var(--text)]">Admin Controls</h3>
              <AdminBookingEditor />
            </div>
          </div>

          <div className="lg:w-1/4">
            <BookingPanel />
          </div>
        </div>
      ) : (
        // Normal User Layout (75% + 25%)
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-3/4">
            <TableGrid onSelect={selectTable} />
          </div>

          <div className="lg:w-1/4">
            <BookingPanel />
          </div>
        </div>
      )}
    </div>
  );
 
}