import React from 'react'
import { Button } from '../ui/button'
import { UiButton } from '@/interface/interface'

const AllButton:React.FC<UiButton> = ({text, onClick}) => {
  return (
    <Button className='px-4 py-2 bg-transparent text-white hover:bg-white hover:text-black text-base rounded border-none outline-none shadow-none'
    onClick={onClick}>
        {text}
    </Button>
  )
}

export default AllButton