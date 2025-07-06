'use client';
import React, { useState } from 'react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useRegister } from '@/hooks/useRegister';
import { toast } from 'react-toastify';

const Registration = () => {

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const register = useRegister();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            return toast.error('Password does not match');
        };

        register.mutate(form);
    }

    return (
        <form className='flex flex-col gap-8 w-full' onSubmit={handleSubmit}>
            <div className='flex flex-col gap-2'>
                <p className='text-[12px] font-medium'>Name<span className='text-red-500'>*</span></p>
                <Input
                    type='text'
                    placeholder='Enter your Full Name'
                    value={form.name}
                    name='name'
                    onChange={handleChange}
                    className='w-full h-[2.5rem] border-none focus:outline-none rounded-lg bg-white text-gray-600'
                />
            </div>
            <div className='flex flex-col gap-2'>
                <p className='text-[12px] font-medium'>Email<span className='text-red-500'>*</span></p>
                <Input
                    type='text'
                    placeholder='Enter your Email'
                    value={form.email}
                    name='email'
                    onChange={handleChange}
                    className='w-full h-[2.5rem] border-none focus:outline-none rounded-lg bg-white text-gray-600'
                />
            </div>
            <div className='flex flex-col gap-2'>
                <p className='text-[12px] font-medium'>Password<span className='text-red-500'>*</span></p>
                <Input
                    type='text'
                    placeholder='Enter your Password'
                    value={form.password}
                    name='password'
                    onChange={handleChange}
                    className='w-full h-[2.5rem] border-none focus:outline-none rounded-lg bg-white text-gray-600'
                />
            </div>
            <div className='flex flex-col gap-2'>
                <p className='text-[12px] font-medium'>Confirm Password<span className='text-red-500'>*</span></p>
                <Input
                    type='text'
                    placeholder='Confirm your Password'
                    value={form.confirmPassword}
                    name='confirmPassword'
                    onChange={handleChange}
                    className='w-full h-[2.5rem] border-none focus:outline-none rounded-lg bg-white text-gray-600'
                />
            </div>
            <Button type='submit'
                className='w-full h-[2rem] flex items-center justify-center text-white bg-blue-500 hover:bg-blue-300 rounded-lg'>
                {register.isPending ? 'Signing up' : 'Sign up'}
            </Button>
        </form>
    )
}

export default Registration