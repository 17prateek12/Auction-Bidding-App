import { useMutation } from '@tanstack/react-query';
import { useCreateEventStore } from '@/store/create-event-form-store';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/env';

export const useCreateEvent = () => {
  const reset = useCreateEventStore((s) => s.reset);
  const router = useRouter();
  const token = Cookies.get('accessToken');

  const apiBaseUrl = API_BASE_URL;

  return useMutation({
    mutationFn: async (eventPayload: any) => {
      const res = await axios.post(
        `${apiBaseUrl}/api/event/create-event`,
        eventPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Event Created Successfully!');
      reset();
      router.push('/mine-event');
    },
    onError: (error: any) => {
      console.error('Create Event Error:', error);
      const msg = error?.response?.data?.message || error?.message || 'Failed to create event';
      toast.error(msg);
    },
  });
};