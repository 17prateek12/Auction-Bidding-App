import { LucideIcon } from "lucide-react";
import { EventForm, TimeObject } from "../types/create-event-type";
import { MouseEventHandler } from "react";

export interface QueryProviderProps {
    children: React.ReactNode;
};

export interface NavBarItem {
    logo: LucideIcon;
    label: string;
    link: string;
};


export interface DateTimePickerProps {
    startDate: Date | undefined;
    endDate: Date | undefined;
    eventstartTime: TimeObject;
    eventendTime: TimeObject;
    onChange: (field: keyof EventForm | 'eventstartTime' | 'eventendTime', value: any) => void
}

export interface Heading {
    text: string;
    isImp: boolean;
}

export interface UiButton{
    text:string;
    onClick: MouseEventHandler
}