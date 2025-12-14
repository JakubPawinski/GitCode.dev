import { useState } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';

export default function LogoutButton() {
    const { logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
        await logout();
        } finally {
        setIsLoggingOut(false);
        }
    };

    return (
        <button onClick={handleLogout} disabled={isLoggingOut}>
        {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
    );
}