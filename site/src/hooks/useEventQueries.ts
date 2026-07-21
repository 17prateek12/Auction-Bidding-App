import { API_BASE_URL } from '@/lib/env';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Cookies from 'js-cookie';

const apiBaseUrl = API_BASE_URL;

export const useAllEvents = (page = 1, limit = 50) => {
  return useQuery({
    queryKey: ['allEvents', page, limit],
    queryFn: async () => {
      try {
        const res = await axios.get(`${apiBaseUrl}/api/event/events?page=${page}&limit=${limit}`);
        return res.data?.event || res.data || [];
      } catch (err) {
        console.error('Fetch All Events Error:', err);
        return [];
      }
    },
    refetchInterval: 10000,
  });
};

export const useMyEvents = () => {
  return useQuery({
    queryKey: ['myEvents'],
    queryFn: async () => {
      const token = Cookies.get('accessToken');
      if (!token) return [];
      try {
        const res = await axios.get(`${apiBaseUrl}/api/event/user-event`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return res.data?.event || res.data || [];
      } catch (err) {
        console.error('Fetch My Events Error:', err);
        return [];
      }
    },
    refetchInterval: 10000,
  });
};
