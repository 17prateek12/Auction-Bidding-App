import { useAuthMutation } from "./useAuthMutation";
import { LoginInput, LoginResponse } from "@/types/auth";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';
import { AxiosError } from "axios";

export const useLogin = () =>{
    const router = useRouter();
    return useAuthMutation<LoginInput, LoginResponse>('login',{
        onSuccess:(data)=>{
            Cookies.set('accessToken',data.accessToken, {expires:7});
            Cookies.set('userId',data.userId, {expires:7});
            Cookies.set('name',data.name, {expires:7});
            Cookies.set('userEmail',data.userEmail, {expires:7});
            router.push('/home');
            toast.success(`Welcome ${data.name}`)
        },
        onError:(error)=>{
            const err = error as AxiosError<{message?:string}>;
            toast.error(err.response?.data?.message || 'Login Failed');
        },
    }
    );
};