import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { UserIcon, KeyIcon, WalletIcon } from '@heroicons/react/24/outline';

const SettingsPage = () => {
  const { user, fetchUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authAPI.updateProfile(profileForm);
      await fetchUser();
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    }
    setIsLoading(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordForm.new_password !== passwordForm.new_password_confirm) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordForm.new_password.length < 10) {
      toast.error('Password must be at least 10 characters');
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.changePassword(passwordForm);
      toast.success('Password changed successfully');
      setPasswordForm({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    }
    setIsLoading(false);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'security', label: 'Security', icon: KeyIcon },
    { id: 'wallets', label: 'Connected Wallets', icon: WalletIcon },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-exchange-text mb-6">Settings</h1>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3">
          <div className="card p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-exchange-bg text-primary-400'
                      : 'text-exchange-muted hover:text-exchange-text hover:bg-exchange-bg'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="col-span-9">
          {activeTab === 'profile' && (
            <div className="card p-6">
              <h2 className="text-lg font-medium text-exchange-text mb-6">Profile Information</h2>

              <div className="mb-6 p-4 bg-exchange-bg rounded-lg">
                <div className="text-sm text-exchange-muted mb-1">Email</div>
                <div className="text-exchange-text">{user?.email}</div>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-exchange-muted mb-2">First Name</label>
                    <input
                      type="text"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                      className="input"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-exchange-muted mb-2">Last Name</label>
                    <input
                      type="text"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                      className="input"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="btn btn-primary">
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card p-6">
              <h2 className="text-lg font-medium text-exchange-text mb-6">Change Password</h2>

              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm text-exchange-muted mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.old_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                    className="input"
                    placeholder="Enter current password"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-exchange-muted mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className="input"
                    placeholder="At least 10 characters"
                    required
                    minLength={10}
                  />
                </div>
                <div>
                  <label className="block text-sm text-exchange-muted mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.new_password_confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirm: e.target.value })}
                    className="input"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                <button type="submit" disabled={isLoading} className="btn btn-primary">
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'wallets' && (
            <div className="card p-6">
              <h2 className="text-lg font-medium text-exchange-text mb-6">Connected Wallets</h2>

              <div className="bg-exchange-bg rounded-lg p-6 text-center">
                <WalletIcon className="w-12 h-12 text-exchange-muted mx-auto mb-4" />
                <p className="text-exchange-muted mb-4">
                  Connect your MetaMask or WalletConnect wallet for Web3 authentication.
                </p>
                <button className="btn btn-primary">
                  Connect Wallet
                </button>
              </div>

              <div className="mt-6 p-4 bg-warning/10 border border-warning/30 rounded-lg">
                <p className="text-warning text-sm">
                  DEMO MODE: Wallet connection is simulated in this demo.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;