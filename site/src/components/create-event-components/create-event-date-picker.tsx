import React from 'react'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format } from "date-fns"
import { cn } from '@/lib/utils'
import { DateTimePickerProps } from '@/interface/interface'
import FormHeading from '../reusable-components/form-heading'

const CreateEventDate: React.FC<DateTimePickerProps> = ({
  startDate,
  endDate,
  eventstartTime,
  eventendTime,
  onChange
}) => {

  const handleTimeChange = (
    field: 'eventstartTime' | 'eventendTime',
    subfield: 'hours' | 'minutes',
    value: number
  ) => {
    const safe = Math.max(0, Math.min(subfield === 'hours' ? 23 : 59, value));
    const updateTime = {
      ...(field === 'eventstartTime' ? eventstartTime : eventendTime),
      [subfield]: safe,
    };
    onChange(field, updateTime);
  }


  return (
    <div className='flex flex-wrap items-center w-full justify-between gap-2'>
      <Popover>
        <div className="flex flex-col gap-2 w-full sm:w-[300px]">
          <FormHeading text={'Pick Event Date'} isImp={true} />
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon />
              {startDate ? (
                endDate ? (
                  <>
                    {format(startDate, "LLL dd, y")} - {format(endDate, "LLL dd, y")}
                  </>
                ) : (
                  format(startDate, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={startDate}
            selected={{ from: startDate, to: endDate }}
            onSelect={(range) => {
              if (range?.from) onChange("eventDate", range.from);
              if (range?.to) onChange("endDate", range.to ?? range.from);
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      <div className='flex flex-col gap-2'>
        <FormHeading text={'Start Time'} isImp={true} />
        <Input
          type="time"
          className='sm:w-[200px] w-fit bg-white text-black'
          value={`${String(eventstartTime.hours).padStart(2, '0')}:${String(eventstartTime.minutes).padStart(2, '0')}`}
          onChange={(e) => {
            const [hours, minutes] = e.target.value.split(":").map(Number);
            onChange("eventstartTime", { hours, minutes });
          }}
        />
      </div>
      <div className='flex flex-col gap-2'>
        <FormHeading text={'End Time'} isImp={true} />
        <Input
          type="time"
          className='sm:w-[200px] w-fit bg-white text-black'
          value={`${String(eventendTime.hours).padStart(2, '0')}:${String(eventendTime.minutes).padStart(2, '0')}`}
          onChange={(e) => {
            const [hours, minutes] = e.target.value.split(":").map(Number);
            onChange("eventendTime", { hours, minutes });
          }}
        />
      </div>
    </div>
  )
}

export default CreateEventDate
