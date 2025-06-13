import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const createBooking = async (bookingData) => {
  try {
    const token = localStorage.getItem('token');
    
    console.log('Final booking payload being sent to API:', bookingData);
   
    const response = await axios.post(`${API_BASE_URL}/bookings`, {
      table: bookingData.table,  // Change from tableId to table
      user: bookingData.user,    // Change from userId to user
      startTime: bookingData.startTime,
      endTime: bookingData.endTime
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Booking error details:', {
      request: error.config,
      response: error.response?.data
    });
    throw new Error(error.response?.data?.message || 'Booking failed');
  }
};

export const getBookings = async (params) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/bookings`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch bookings');
  }
};

//admin: UPDATE booking req:
export const updateBooking = async (bookingId, startTime, endTime) => {
  const token = localStorage.getItem('token');
  const res = await axios.put(`${API_BASE_URL}/bookings/${bookingId}`, {
    startTime,
    endTime,
  }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

//admin: DELETE booking req
export const deleteBooking = async (bookingId) => {
  const token = localStorage.getItem('token');
  const res = await axios.delete(`${API_BASE_URL}/bookings/${bookingId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};