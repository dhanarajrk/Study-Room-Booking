import axios from 'axios';

export const getTables = async () => {
  try {
    const response = await axios.get('/api/auth/tables');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch tables');
  }
};