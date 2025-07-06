'use client';
import { LogoutResponse } from "@/types/auth";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';
import Cookies from "js-cookie";


export const useLogout = () => {
    const router = useRouter();
    const accessToken = Cookies.get('accessToken')

    return useMutation<LogoutResponse, unknown, void>({
        mutationFn: async () => {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/logout`, {}, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            return res.data;
        },
        onSuccess: () => {
            Cookies.remove('accessToken');
            Cookies.remove('name');
            Cookies.remove('userId');
            Cookies.remove('userEmail');
            toast.success('Successfully Logout');
            router.push('/');
        },
        onError: () => {
            toast.error('Logout Failed')
        }
    })
}