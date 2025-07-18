import { create } from 'zustand';
import { createBooking, getBookings } from '../api/booking.js';
import { getTables } from '../api/table.js';
import axios from 'axios';
import { cancelBooking as cancelBookingAPI } from '../api/booking';

const useBookingStore = create((set, get) => ({
  selectedDate: new Date(),
  selectedTable: null,
  selectedTime: null,
  bookings: [],
  tables: [], // Add tables state
  bookingModalOpen: false,
  minutes: 0,
  totalAmount: '0.00',
  isLoading: false,
  error: null,
  myBookings: [], //to store upcoming Bookings for the logged in user

  // Actions
  setDate: (date) => set({ selectedDate: date }),
  selectTable: (table) => set({ selectedTable: table }),
  addBooking: (booking) => set((state) => ({
    bookings: [...state.bookings, booking]
  })),
  setHours: (hours) => set({ hours }),
  setMinutes: (minutes) => set({ minutes }),
  setTotalAmount: (amount) => set({ totalAmount: amount }),
  setSelectedTime: (time) => set({ selectedTime: time }),

  openBookingModal: () => {
    const state = get();
    if (!state.selectedTable || !state.selectedTime) {
      console.warn('Prevented modal open - missing requirements');
      return;
    }
    set({ bookingModalOpen: true });
  },

  closeBookingModal: () => set({ 
    bookingModalOpen: false, 
    error: null 
  }),
  
  setDuration: (hours, minutes) => set({ hours, minutes }),

  calculateTotal: () => {
    const state = get();
    const hourlyRate = 30; // Rs.30 base rate
    return (state.hours * hourlyRate + (state.minutes / 60) * hourlyRate).toFixed(2);
  },

  clearSelection: () => set({ selectedTable: null }),

  //if submitBooking(userId) is called without (payment), then payment will default its value to null. And if submitBooking(userId, payment) is called, then payment is not null. Likewise for manualBookedUser also
  submitBooking: async (userId, payment = null, manualBookedUser = null) => {
    const currentState = get();
    set({ isLoading: true, error: null });

    try {
      console.log('Selected table:', currentState.selectedTable);

      const bookingData = {
        table: currentState.selectedTable._id,
        user: userId,
        startTime: currentState.selectedTime.toISOString(),
        endTime: new Date(
          currentState.selectedTime.getTime() +
          (currentState.hours * 60 * 60 * 1000) +
          (currentState.minutes * 60 * 1000)
        ).toISOString(),
        ...(payment && { payment }), // only include if not null, payment will not be null if submitBooking is called as submitBooking(user._id, payment)
        ...(manualBookedUser && { manualBookedUser })
      };

      console.log("Preparing to book:", bookingData);

      const booking = await createBooking(bookingData);

      // Refresh bookings
      const startOfDay = new Date(currentState.selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(currentState.selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      await get().fetchBookings({
        startTime: startOfDay.toISOString(),
        endTime: endOfDay.toISOString()
      });

      set({
        bookingModalOpen: false,
        isLoading: false,
        selectedTable: null,
        selectedTime: null,
        hours: 0,
        minutes: 0
      });

      return booking;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  fetchBookings: async (date) => {
    set({ isLoading: true });
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const bookings = await getBookings({
        startTime: startOfDay.toISOString(),
        endTime: endOfDay.toISOString()
      });

      set({
        bookings: bookings.map(booking => ({
          ...booking,
          tableId: booking.table?._id || booking.table // Normalize to tableId
        })),
        isLoading: false
      });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchTables: async () => {
    set({ isLoading: true });
    try {
      const tables = await getTables(); // Use your existing service
      set({
        tables,
        isLoading: false
      });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  // Initialize store
  initialize: async () => {
    await get().fetchTables();
    await get().fetchBookings(get().selectedDate);
  },

  //use for fetching the user booked slots in MyBookings
  fetchMyBookings: async (userId) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/auth/bookings/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      set({ myBookings: res.data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  cancelBooking: async (bookingId, userId) => {
    set({ isLoading: true });
    try {
      await cancelBookingAPI(bookingId);
      await get().fetchMyBookings(userId); // Refresh bookings
      set({ isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  //Socket IO Part Realtime update functions:

  //update cancelled booking status in real-time after a user cancelled his booking, it will be take immediate effect to other user using websocket
  updateBookingCancelStatus: (updatedBooking) => {
    console.log("🔄 Updating booking:", updatedBooking);
    set((state) => ({
      bookings: state.bookings.map((booking) =>
        booking._id === updatedBooking.bookingId // Match by booking ID
          ? { ...booking, status: updatedBooking.status } // Update the status
          : booking
      ),
    }));
  },

  //Re render with new booking in realtime
  updateBookingCreate: (newBooking) => {
    console.log("🔄 Adding new booking:", newBooking);
    set((state) => ({
      bookings: [...state.bookings, newBooking], // Append the new booking to the list
    }));
  },

  //Re render when admin edited a booking slot
  updateEditedBooking: (updatedBooking) => {
    console.log("🔄 Updating booking:", updatedBooking);
    set((state) => ({
      bookings: state.bookings.map((booking) =>
        booking._id === updatedBooking._id
          ? { ...booking, ...updatedBooking } // Merge the updated booking
          : booking
      ),
    }));
  },
  

}));

export default useBookingStore;