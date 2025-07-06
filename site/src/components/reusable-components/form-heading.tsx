import React from 'react'
import { Heading } from '@/interface/interface'

const FormHeading: React.FC<Heading> = ({
    text,
    isImp
}) => {
    return (
        <>
            {
                isImp ?
                    (
                        <p
                            className="text-sm font-medium text-white">
                            {text}
                            <span className="text-red-500">*</span>
                        </p>) :
                    (
                        <p className="text-sm font-medium text-white">
                            {text}
                        </p>)
            }
        </>
    )
}

export default FormHeading