import { useState, useEffect, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Camera, LogOut, Save, X, AlertCircle, ArrowLeft } from 'lucide-react';
import { signOut, getAuthToken } from '../utils/auth';

interface UserProfile {
  name: string;
  email: string;
  profilePhoto?: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile>({ name: '', email: '' });
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // Form states
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsFetchingProfile(true);
      setError(''); // Clear previous errors
      
      const token = getAuthToken();
      console.log('Auth token exists:', !!token);
      
      if (!token) {
        console.error('No auth token found, redirecting to signin');
        navigate('/signin');
        return;
      }

      console.log('Fetching profile from: /auth/profile');
      console.log('Token (first 20 chars):', token.substring(0, 20) + '...');
      
      const response = await fetch('/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Profile response status:', response.status);
      console.log('Profile response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Profile data received:', data);
        
        if (data.user) {
          setProfile(data.user);
          setNewName(data.user.name);
          setNewEmail(data.user.email);
          if (data.user.profilePhoto) {
            setPhotoPreview(data.user.profilePhoto);
          }
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        const errorText = await response.text();
        console.error('Profile fetch failed:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || 'Failed to fetch profile' };
        }
        throw new Error(errorData.message || `Server returned ${response.status}`);
      }
    } catch (err: any) {
      console.error('Profile fetch error:', err);
  const errorMessage = err.message || 'Failed to load profile. Please ensure the backend server is reachable.';
      setError(errorMessage);
    } finally {
      setIsFetchingProfile(false);
    }
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('photo', photoFile);

      const response = await fetch('/auth/profile/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setProfile({ ...profile, profilePhoto: data.photoUrl });
        setSuccess('Profile photo updated successfully');
        setPhotoFile(null);
        // Notify app shell to refresh sidebar user
        window.dispatchEvent(new CustomEvent('profile:updated', { detail: { profilePhoto: data.photoUrl } }));
      } else {
        throw new Error(data.message || 'Failed to upload photo');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = getAuthToken();
      const response = await fetch('/auth/profile/name', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName }),
      });

      const data = await response.json();

      if (response.ok) {
        setProfile({ ...profile, name: newName });
        setIsEditingName(false);
        setSuccess('Name updated successfully');
        // Notify app shell to refresh sidebar user
        window.dispatchEvent(new CustomEvent('profile:updated', { detail: { name: newName } }));
      } else {
        throw new Error(data.message || 'Failed to update name');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update name');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = getAuthToken();
      const response = await fetch('/auth/profile/email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setProfile({ ...profile, email: newEmail });
        setIsEditingEmail(false);
        setSuccess('Email updated successfully');
        // Notify app shell to refresh sidebar user
        window.dispatchEvent(new CustomEvent('profile:updated', { detail: { email: newEmail } }));
      } else {
        throw new Error(data.message || 'Failed to update email');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = getAuthToken();
      const response = await fetch('/auth/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsEditingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess('Password changed successfully');
      } else {
        throw new Error(data.message || 'Failed to change password');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/signin');
    } catch (err: any) {
      setError(err.message || 'Failed to logout');
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-main overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-main border-b border-border-color px-6 py-4">
        <div className="flex items-start gap-3">
          <button
            onClick={handleBack}
            className="mt-1 p-2 rounded-lg hover:bg-accent text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Profile Settings</h1>
            <p className="text-sm text-text-secondary mt-1">Manage your account settings and preferences</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 max-w-3xl mx-auto w-full">
        {/* Loading State */}
        {isFetchingProfile && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        )}

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-green-500" />
            <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {!isFetchingProfile && (
          <>

        {/* Profile Photo Section */}
        <div className="bg-bg-sidebar rounded-2xl border border-border-color p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Profile Photo</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-text-secondary" />
                )}
              </div>
              <label
                htmlFor="photo-upload"
                className="absolute bottom-0 right-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-600 transition-colors shadow-lg"
              >
                <Camera className="w-4 h-4 text-white" />
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-text-secondary mb-2">
                Upload a profile photo (Max 5MB)
              </p>
              {photoFile && (
                <button
                  onClick={handlePhotoUpload}
                  disabled={isLoading}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {isLoading ? 'Uploading...' : 'Save Photo'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Full Name Section */}
        <div className="bg-bg-sidebar rounded-2xl border border-border-color p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Full Name</h2>
            {!isEditingName && (
              <button
                onClick={() => setIsEditingName(true)}
                className="text-sm text-purple-500 hover:text-purple-600 font-medium"
              >
                Edit
              </button>
            )}
          </div>
          {isEditingName ? (
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-bg-input border border-border-color text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your name"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateName}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditingName(false);
                    setNewName(profile.name);
                    setError('');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-text-primary rounded-lg hover:bg-accent-selected transition-colors text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-text-primary">{profile.name}</p>
          )}
        </div>

        {/* Email Section */}
        <div className="bg-bg-sidebar rounded-2xl border border-border-color p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Email Address</h2>
            {!isEditingEmail && (
              <button
                onClick={() => setIsEditingEmail(true)}
                className="text-sm text-purple-500 hover:text-purple-600 font-medium"
              >
                Edit
              </button>
            )}
          </div>
          {isEditingEmail ? (
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-bg-input border border-border-color text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your email"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateEmail}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditingEmail(false);
                    setNewEmail(profile.email);
                    setError('');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-text-primary rounded-lg hover:bg-accent-selected transition-colors text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-text-primary">{profile.email}</p>
          )}
        </div>

        {/* Change Password Section */}
        <div className="bg-bg-sidebar rounded-2xl border border-border-color p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Change Password</h2>
            {!isEditingPassword && (
              <button
                onClick={() => setIsEditingPassword(true)}
                className="text-sm text-purple-500 hover:text-purple-600 font-medium"
              >
                Change
              </button>
            )}
          </div>
          {isEditingPassword ? (
            <div className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-bg-input border border-border-color text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Current password"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-bg-input border border-border-color text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="New password (min 8 characters)"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-bg-input border border-border-color text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Confirm new password"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleChangePassword}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  <Save className="w-4 h-4" />
                  Update Password
                </button>
                <button
                  onClick={() => {
                    setIsEditingPassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-text-primary rounded-lg hover:bg-accent-selected transition-colors text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-text-secondary">••••••••</p>
          )}
        </div>

        {/* Logout Section */}
        <div className="bg-bg-sidebar rounded-2xl border border-border-color p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-2">Logout</h2>
          <p className="text-sm text-text-secondary mb-4">Sign out of your account</p>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
        </>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-sidebar rounded-2xl border border-border-color p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-text-primary mb-2">Confirm Logout</h3>
            <p className="text-text-secondary mb-6">
              Are you sure you want to logout? You'll need to sign in again to access your account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Yes, Logout
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 bg-accent text-text-primary rounded-lg hover:bg-accent-selected transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
