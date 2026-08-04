import useAuthStore from '@/store/auth-store';
import { Loader } from 'lucide-react';
import React, { useEffect } from 'react'
import { replace, useNavigate, useSearchParams } from 'react-router-dom'

const AuthCallback = () => {

    const [searchParams] = useSearchParams();

    const setAccessToken = useAuthStore((state) => state.setAccessToken);

    const navigate = useNavigate();

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');

        if (accessToken) {
            setAccessToken(accessToken)
            navigate('/projects', { replace: true })
        } else {
            navigate('/login', { replace: true });
        }
    }, []);

    return (
        <div className='h-screen w-screen flex items-center justify-center'>
            <Loader className='text-[#0071e3] animate-spin' />
        </div>
    )
}

export default AuthCallback
