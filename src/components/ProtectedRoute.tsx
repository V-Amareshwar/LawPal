import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      // Redirect to sign in if not authenticated
      navigate('/signin', { replace: true });
    }
  }, [navigate]);

  // Only render children if authenticated
  if (!isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
}
