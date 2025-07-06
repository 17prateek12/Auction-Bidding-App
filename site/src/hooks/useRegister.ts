import { useAuthMutation } from "./useAuthMutation";
import { RegisterInput, RegisterResponse } from "@/types/auth";
import { AxiosError } from "axios";
import { toast } from 'react-toastify';

export const useRegister = () =>{
    return useAuthMutation<RegisterInput, RegisterResponse>('register',{
        onSuccess:(data)=>{
            toast.success(`${data.email} got register successfully`);
        },
        onError:(error) =>{
            const err = error as AxiosError<{message?:string}>
            toast.error(err.response?.data?.message || 'Registration failed');
        },
    });
};