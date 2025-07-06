export type TimeObject = {
    hours: number;
    minutes: number;
  };

export type EventForm = {
    eventName: string
    description: string
    eventDate: Date | undefined
    startTime: string | undefined
    endTime: string | undefined
    columns: string[]
    rows: Record<string, any>[]
    endDate?: Date
}

export type EventStore = {
    data: EventForm
    setField: <T extends keyof EventForm>(field:T, value:EventForm[T]) => void
    reset: ()=> void
}