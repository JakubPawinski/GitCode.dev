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
        <button className='"from-primary/20 to-accent/10 hover:from-primary/30 hover:to-accent/20 text-foreground/80 hover:text-foreground border-primary/30 transform cursor-pointer rounded-full border bg-gradient-to-r px-3 py-1.5 text-xs font-semibold shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg 'onClick={handleLogout} disabled={isLoggingOut}>
        {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
    );
}