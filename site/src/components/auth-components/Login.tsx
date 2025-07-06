'use client';
import React, { useState } from 'react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useLogin } from '@/hooks/useLogin'

const Login = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const login = useLogin();

    const handleSubmit = (e:React.FormEvent) =>{
        e.preventDefault();
        login.mutate({email,password})
    }

    return (
        <form className='flex flex-col gap-8 w-full' onSubmit={handleSubmit}>
            <div className='flex flex-col gap-2'>
                <p className='text-[12px] font-medium'>Email<span className='text-red-500'>*</span></p>
                <Input
                    type='text'
                    placeholder='Enter your Email'
                    value={email}
                    onChange={(e)=>setEmail(e.target.value)}
                    className='w-full h-[2.5rem] border-none focus:outline-none rounded-lg bg-white text-gray-600'
                />
            </div>
            <div className='flex flex-col gap-2'>
                <p className='text-[12px] font-medium'>Password<span className='text-red-500'>*</span></p>
                <Input
                    type='text'
                    placeholder='Enter your Password'
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
                    className='w-full h-[2.5rem] border-none focus:outline-none rounded-lg bg-white text-gray-600'
                />
            </div>
            <Button type='submit'
            className='w-full h-[2rem] flex items-center justify-center text-white bg-blue-500 hover:bg-blue-300 rounded-lg'>
                {login.isPending?'Signing In': 'Sign In'}
            </Button>
        </form>
    )
}

export default Login