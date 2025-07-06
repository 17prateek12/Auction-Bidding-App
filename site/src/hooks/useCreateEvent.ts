import { useMutation } from "@tanstack/react-query";
import { useCreateEventStore } from "@/store/create-event-form-store";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

export const useCreateEvent = () => {
    const reset = useCreateEventStore((s) => s.reset)
    const token = Cookies.get('accessToken');

    return useMutation({
        mutationFn: async (data: any) => {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/event/create-event`, {
                data
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
            if (!res) {
                throw new Error('Failed to create event');
            }
            return res;
        },
        onSuccess: () => {
            toast('Event Created SuccessFully'),
                reset()
        },
        onError: (error: any) => {
            toast(error.message);
        }
    })
}