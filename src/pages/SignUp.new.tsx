import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, CheckCircle2, Clock } from 'lucide-react';

export default function SignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<'email' | 'verify' | 'password'>('email');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [userId, setUserId] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0); // seconds

  // Cooldown ticker for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Hydrate userId from storage if available (handles refresh between steps)
  useEffect(() => {
    if (!userId) {
      const stored = localStorage.getItem('signup_userId');
      if (stored) setUserId(stored);
    }
  }, []);

  // Check if token is in URL (from email link) but DON'T auto-verify
  // User must click "Verify Email" button to prevent auto-verification by email clients
  useEffect(() => {
    const token = searchParams.get('token');
    if (token && !isEmailVerified) {
      // Store the token but don't auto-verify
      setVerificationToken(token);
      // Move to verify step to show the "Verify Email" button
      setStep('verify');
      // Extract email from URL if available
      const emailParam = searchParams.get('email');
      if (emailParam) {
        setFormData(prev => ({ ...prev, email: emailParam }));
      }
    }
  }, [searchParams, isEmailVerified]);

  // Clear any previous errors once we reach password step with verified email
  useEffect(() => {
    if (step === 'password' && isEmailVerified && error) {
      setError('');
    }
  }, [step, isEmailVerified]);

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // If backend indicates verified but no password yet, proceed to password step
        if (data.requirePasswordSetup && data.userId) {
          setUserId(data.userId);
          localStorage.setItem('signup_userId', data.userId);
          setIsEmailVerified(true);
          setStep('password');
          return;
        }
        setUserId(data.userId);
        if (data.userId) {
          localStorage.setItem('signup_userId', data.userId);
        }
        if (data.verificationToken) setVerificationToken(data.verificationToken); // For dev purposes
        setStep('verify');
      } else {
        setError(data.message || 'Failed to send verification email');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    setError('');
    setResendMsg('');
    setIsLoading(true);

    try {
      const response = await fetch('/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsEmailVerified(true);
        if (data.user?.id) {
          setUserId(data.user.id);
          localStorage.setItem('signup_userId', data.user.id);
        }
        setStep('password');
        setError('');
        // Remove token query from hash URL to prevent re-verification on refresh
        try {
          const url = new URL(window.location.href);
          if (url.hash && url.hash.includes('?')) {
            const [hashPath] = url.hash.split('?');
            url.hash = hashPath; // drop query params in hash
            window.history.replaceState(null, '', url.toString());
          }
        } catch {}
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResendMsg('');
    setIsLoading(true);
    try {
      const response = await fetch('/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'Failed to resend verification');
      setResendMsg(data?.message || 'Verification email resent');
      setResendCooldown(30); // start 30s cooldown
    } catch (e: any) {
      setError(e.message || 'Failed to resend verification');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userId) {
      setError('Missing account context. Please verify your email from the link we sent, then set your password.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the terms and privacy policy');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('authToken', data.token);
        localStorage.removeItem('signup_userId');
        // Notify app shell to load user profile
        window.dispatchEvent(new CustomEvent('auth:login'));
        navigate('/app/');
      } else {
        setError(data.message || 'Failed to set password');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength === 3) return { strength, label: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 4) return { strength, label: 'Good', color: 'bg-green-500' };
    return { strength, label: 'Strong', color: 'bg-green-600' };
  };

  const strength = passwordStrength(formData.password);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-y-auto p-2 sm:p-3" style={{ backgroundColor: '#0e0e14' }}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Glassmorphism card */}
      <div className="relative z-10 w-full max-w-sm my-1">
        <div 
          className="rounded-3xl shadow-2xl p-4 sm:p-5"
          style={{
            backdropFilter: 'blur(16px)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Logo/Brand */}
          <div className="text-center mb-2">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 mb-1.5 shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white mb-0.5">Create Account</h1>
            <p className="text-xs text-gray-300">
              {step === 'email' && 'Join LawPal today'}
              {step === 'verify' && 'Verify your email'}
              {step === 'password' && 'Set your password'}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-2 p-2 rounded-xl bg-red-500/20 border border-red-500/30 backdrop-blur-sm">
              <p className="text-red-200 text-xs text-center">{error}</p>
            </div>
          )}

          {/* Step 1: Email Input */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-1.5">
              {/* Name field */}
              <div className="space-y-0.5">
                <label htmlFor="name" className="text-xs font-medium text-gray-300">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full pl-10 pr-3 py-1.5 text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all"
                  />
                </div>
              </div>

              {/* Email field */}
              <div className="space-y-0.5">
                <label htmlFor="email" className="text-xs font-medium text-gray-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    disabled={isEmailVerified}
                    className="w-full pl-10 pr-10 py-1.5 text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all disabled:opacity-60"
                  />
                  {isEmailVerified && (
                    <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-400" />
                  )}
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 group mt-3"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Email</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Verify Email */}
          {step === 'verify' && (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-3">
                <Mail className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Check your email</h2>
              <p className="text-xs text-gray-300 mb-4">
                We've sent a verification link to<br />
                <span className="text-white font-medium">{formData.email}</span>
              </p>

              <div className="flex flex-col items-center gap-2 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Waiting for verification...</span>
                </div>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading || !formData.email || resendCooldown > 0}
                  className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification email'}
                </button>
                {resendMsg && <p className="text-green-300">{resendMsg}</p>}
              </div>
            </div>
          )}

          {/* Step 3: Set Password */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-1.5">
              {/* Email display (verified) */}
              <div className="space-y-0.5 mb-2">
                <label className="text-xs font-medium text-gray-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full pl-10 pr-10 py-1.5 text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 disabled:opacity-60"
                  />
                  <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-400" />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-0.5">
                <label htmlFor="password" className="text-xs font-medium text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-1.5 text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password strength indicator */}
                {formData.password && (
                  <div className="mt-0.5">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-0.5 flex-1 rounded-full transition-all ${
                            i < strength.strength ? strength.color : 'bg-white/20'
                          }`}
                        ></div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-300 mt-0.5">Strength: {strength.label}</p>
                  </div>
                )}
              </div>

              {/* Confirm Password field */}
              <div className="space-y-0.5">
                <label htmlFor="confirmPassword" className="text-xs font-medium text-gray-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-1.5 text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <div className="flex items-center gap-1 text-green-400 text-xs mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Match</span>
                  </div>
                )}
              </div>

              {/* Terms checkbox */}
              <div className="flex items-start gap-1.5 pt-0.5">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                />
                <label htmlFor="terms" className="text-xs text-gray-300 leading-tight">
                  I agree to the{' '}
                  <Link to="/terms" className="text-white hover:text-blue-400 underline">
                    Terms
                  </Link>{' '}
                  &{' '}
                  <Link to="/privacy" className="text-white hover:text-blue-400 underline">
                    Privacy
                  </Link>
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-400">
              Already have an account?{' '}
              <Link to="/signin" className="text-white hover:text-blue-400 font-medium transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
