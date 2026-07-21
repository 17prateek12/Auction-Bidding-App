import { API_BASE_URL } from "@/lib/env";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import axios from 'axios';

export const useAuthMutation = <TInput , TResponse>(
    endpoint: string,
    options?: UseMutationOptions<TResponse,unknown,TInput>
)=>{
    const mutationFn = async(data:TInput):Promise<TResponse> => {
        const res = await axios.post(`${API_BASE_URL}/api/user/${endpoint}`,data);
        return res.data;
    };

    return useMutation<TResponse, unknown, TInput>({
        mutationFn,
        ...options,
    });
};