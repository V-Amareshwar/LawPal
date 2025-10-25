import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OAuthFinish() {
  const navigate = useNavigate();
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const token = url.searchParams.get('token');
      if (token) {
        localStorage.setItem('authToken', token);
        window.dispatchEvent(new CustomEvent('auth:login'));
        navigate('/app/', { replace: true });
      } else {
        navigate('/signin?error=oauth_missing_token', { replace: true });
      }
    } catch {
      navigate('/signin?error=oauth_parse_error', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: '#0e0e14' }}>
      <div className="text-white text-sm opacity-70">Finishing sign in…</div>
    </div>
  );
}
