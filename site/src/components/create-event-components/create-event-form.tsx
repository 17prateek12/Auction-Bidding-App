'use client';
import React from 'react';
import { Input } from '../ui/input';
import { Textarea } from "@/components/ui/textarea"
import { useCreateEventStore } from '@/store/create-event-form-store';
import FormHeading from '../reusable-components/form-heading';

const CreateEventForm = () => {

    const setField = useCreateEventStore((s) => s.setField)
    const data = useCreateEventStore((s) => s.data)

    return (
        <form className='w-full flex flex-col gap-4 my-4'>
            <div className='flex flex-col gap-2'>
                <FormHeading text='Event Name' isImp={true} />
                <Input
                    type='text'
                    placeholder='Enter your Event Name'
                    value={data.eventName}
                    onChange={(e) => setField('eventName', e.target.value)}
                    className='w-full h-[2.5rem] border-none focus:outline-none rounded-lg bg-white text-gray-600'
                />
            </div>
            <div className='flex flex-col gap-2'>
            <FormHeading text='Event Description' isImp={false} />
                <Textarea
                    placeholder='Enter your Description'
                    value={data.description}
                    onChange={(e) => setField('description', e.target.value)}
                    className='w-full border-none focus:outline-none rounded-lg bg-white text-gray-600'
                />
            </div>
        </form>
    )
}

export default CreateEventForm