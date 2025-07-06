import { create } from 'zustand';
import { EventStore } from '@/types/create-event-type';

export const useCreateEventStore = create<EventStore>((set, get) => ({
    data: {
        eventName: '',
        description: '',
        eventDate: undefined,
        startTime: undefined,
        endTime: undefined,
        columns: [],
        rows: [],
    },
    setField: <T extends keyof EventStore['data']>(field: T, value: EventStore['data'][T]) => {
        set((state) => ({
            data: {
                ...state.data,
                [field]: value,
            },
        }))
    },
    reset: () =>
        set({
            data: {
                eventName: '',
                description: '',
                eventDate: undefined,
                startTime: undefined,
                endTime: undefined,
                columns: [],
                rows: [],
            },
        }),
}))