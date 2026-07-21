import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TimeObject } from '@/types/create-event-type';
import FormHeading from '../reusable-components/form-heading';

interface CreateEventDateProps {
  eventDate?: Date;
  eventstartTime: TimeObject;
  eventendTime: TimeObject;
  onChange: (field: any, value: any) => void;
}

const CreateEventDate: React.FC<CreateEventDateProps> = ({
  eventDate,
  eventstartTime,
  eventendTime,
  onChange,
}) => {
  // Compute today's date at midnight to disable past dates
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  return (
    <div className="flex flex-wrap items-center w-full justify-between gap-4">
      {/* Event Date Picker (Single Date) */}
      <Popover>
        <div className="flex flex-col gap-2 w-full sm:w-[300px]">
          <FormHeading text={'Pick Event Date'} isImp={true} />
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={'outline'}
              className={cn(
                'w-full justify-start text-left font-normal bg-white text-black border border-gray-300',
                !eventDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {eventDate ? format(eventDate, 'PPP') : <span>Pick event date</span>}
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="single"
            defaultMonth={eventDate || new Date()}
            selected={eventDate}
            disabled={(date) => date < todayMidnight}
            onSelect={(date) => {
              if (date) onChange('eventDate', date);
            }}
          />
        </PopoverContent>
      </Popover>

      {/* Start Time Picker */}
      <div className="flex flex-col gap-2">
        <FormHeading text={'Start Time'} isImp={true} />
        <Input
          type="time"
          className="sm:w-[200px] w-full bg-white text-black"
          value={`${String(eventstartTime.hours).padStart(2, '0')}:${String(eventstartTime.minutes).padStart(2, '0')}`}
          onChange={(e) => {
            const [hours, minutes] = e.target.value.split(':').map(Number);
            onChange('eventstartTime', { hours, minutes });
          }}
        />
      </div>

      {/* End Time Picker */}
      <div className="flex flex-col gap-2">
        <FormHeading text={'End Time'} isImp={true} />
        <Input
          type="time"
          className="sm:w-[200px] w-full bg-white text-black"
          value={`${String(eventendTime.hours).padStart(2, '0')}:${String(eventendTime.minutes).padStart(2, '0')}`}
          onChange={(e) => {
            const [hours, minutes] = e.target.value.split(':').map(Number);
            onChange('eventendTime', { hours, minutes });
          }}
        />
      </div>
    </div>
  );
};

export default CreateEventDate;
