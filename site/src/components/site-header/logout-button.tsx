'use client';
import React from 'react';
import { Button } from '../ui/button';
import { useLogout } from '@/hooks/useLogout';

const LogoutButton = () => {
  const logout = useLogout();

  return (
    <Button onClick={() => logout.mutate()} disabled={logout.isPending}
      className='border-none text-white hover:text-red-500 text-base bg-transparent hover:bg-transparent'>
      {logout.isPending ? 'Signing Out' : 'Sign Out'}
    </Button>
  )
}

export default LogoutButton