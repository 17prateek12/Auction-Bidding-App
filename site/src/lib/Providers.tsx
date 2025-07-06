'use client';
import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query';
import { QueryProviderProps } from '@/interface/interface';

const queryClient = new QueryClient()

export default function Providers({ children }: QueryProviderProps) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}