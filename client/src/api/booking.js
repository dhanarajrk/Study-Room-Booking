import axios from 'axios';

export const createBooking = async (bookingData) => {
  try {
    const token = localStorage.getItem('token');

    console.log('Final booking payload being sent to API:', bookingData);

    const response = await axios.post('/api/auth/bookings', {
      table: bookingData.table,  // Change from tableId to table
      user: bookingData.user,    // Change from userId to user
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      ...(bookingData.payment && { payment: bookingData.payment }), // Conditionally include payment
      ...(bookingData.manualBookedUser && { manualBookedUser: bookingData.manualBookedUser })
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
    const response = await axios.get('/api/auth/bookings', {
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

//User/Admin Cancel slot req:
export const cancelBooking = async (bookingId) => {
  const token = localStorage.getItem('token');
  const res = await axios.delete(`/api/auth/bookings/${bookingId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

//admin: UPDATE booking req:
export const updateBooking = async (bookingId, startTime, endTime) => {
  const token = localStorage.getItem('token');
  const res = await axios.put(`/api/auth/bookings/${bookingId}`, {
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
  const res = await axios.delete(`/api/auth/bookings/delete/${bookingId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};


//Manual Refetch Refund Status req func
export const fetchRefundStatus = async (bookingId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`/api/auth/bookings/refetch-refund/${bookingId}`,{
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
