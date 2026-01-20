/**
 * SecurityPage Component
 * ======================
 * Main security dashboard with all security settings
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import securityService from '../services/securityService';
import TwoFactorSetup from '../components/Security/TwoFactorSetup';
import APIKeysManager from '../components/Security/APIKeysManager';
import IPWhitelist from '../components/Security/IPWhitelist';
import AuditLogs from '../components/Security/AuditLogs';

const SecurityPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [securityData, setSecurityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSecurityOverview();
  }, []);

  const fetchSecurityOverview = async () => {
    try {
      setLoading(true);
      const data = await securityService.getSecurityOverview();
      setSecurityData(data);
      setError(null);
    } catch (err) {
      // Set default data if API fails
      setSecurityData({
        two_factor_enabled: false,
        api_keys_count: 0,
        whitelisted_ips_count: 0,
        recent_login_attempts: 0,
        last_login: null
      });
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ShieldCheckIcon },
    { id: '2fa', label: 'Two-Factor Auth', icon: DevicePhoneMobileIcon },
    { id: 'api-keys', label: 'API Keys', icon: KeyIcon },
    { id: 'ip-whitelist', label: 'IP Whitelist', icon: GlobeAltIcon },
    { id: 'activity', label: 'Activity Log', icon: ClockIcon },
  ];

  const getSecurityScore = () => {
    if (!securityData) return 0;
    let score = 40;
    if (securityData.two_factor_enabled) score += 30;
    if (securityData.whitelisted_ips_count > 0) score += 15;
    if (securityData.api_keys_count > 0) score += 15;
    return Math.min(100, score);
  };

  const securityScore = getSecurityScore();

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreGradient = (score) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e17] text-white p-6 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldCheckIcon className="w-8 h-8 text-blue-500" />
            Security Center
          </h1>
          <p className="text-gray-400 mt-2">
            Manage your account security settings and monitor activity
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-800 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Security Score Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Security Score</h2>
                  <p className="text-gray-400 text-sm">
                    Your account security level based on enabled features
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-5xl font-bold ${getScoreColor(securityScore)}`}>
                    {securityScore}
                  </div>
                  <div className="text-gray-500 text-sm">out of 100</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6 h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getScoreGradient(securityScore)} transition-all duration-1000`}
                  style={{ width: `${securityScore}%` }}
                />
              </div>

              {/* Recommendations */}
              {securityScore < 100 && (
                <div className="mt-6 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-300">Recommendations:</h3>
                  {!securityData?.two_factor_enabled && (
                    <div className="flex items-center gap-3 text-sm text-yellow-400 bg-yellow-400/10 p-3 rounded-lg">
                      <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                      <span>Enable Two-Factor Authentication for enhanced security</span>
                      <button
                        onClick={() => setActiveTab('2fa')}
                        className="ml-auto px-3 py-1 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-400"
                      >
                        Enable
                      </button>
                    </div>
                  )}
                  {securityData?.whitelisted_ips_count === 0 && (
                    <div className="flex items-center gap-3 text-sm text-blue-400 bg-blue-400/10 p-3 rounded-lg">
                      <GlobeAltIcon className="w-5 h-5 flex-shrink-0" />
                      <span>Add IP addresses to whitelist for withdrawal security</span>
                      <button
                        onClick={() => setActiveTab('ip-whitelist')}
                        className="ml-auto px-3 py-1 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400"
                      >
                        Add IP
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Security Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 2FA Status */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <DevicePhoneMobileIcon className="w-8 h-8 text-purple-500" />
                  {securityData?.two_factor_enabled ? (
                    <span className="flex items-center gap-1 text-green-400 text-sm">
                      <CheckCircleIcon className="w-4 h-4" /> Enabled
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400 text-sm">
                      <XCircleIcon className="w-4 h-4" /> Disabled
                    </span>
                  )}
                </div>
                <h3 className="font-semibold">Two-Factor Auth</h3>
                <p className="text-gray-500 text-sm mt-1">
                  {securityData?.two_factor_enabled
                    ? 'Your account is protected with 2FA'
                    : 'Add an extra layer of security'}
                </p>
              </div>

              {/* API Keys */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <KeyIcon className="w-8 h-8 text-blue-500" />
                  <span className="text-2xl font-bold text-white">
                    {securityData?.api_keys_count || 0}
                  </span>
                </div>
                <h3 className="font-semibold">API Keys</h3>
                <p className="text-gray-500 text-sm mt-1">Active API keys for trading</p>
              </div>

              {/* IP Whitelist */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <GlobeAltIcon className="w-8 h-8 text-green-500" />
                  <span className="text-2xl font-bold text-white">
                    {securityData?.whitelisted_ips_count || 0}
                  </span>
                </div>
                <h3 className="font-semibold">Whitelisted IPs</h3>
                <p className="text-gray-500 text-sm mt-1">Trusted IP addresses</p>
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <ClockIcon className="w-8 h-8 text-orange-500" />
                  <span className="text-2xl font-bold text-white">
                    {securityData?.recent_login_attempts || 0}
                  </span>
                </div>
                <h3 className="font-semibold">Login Attempts</h3>
                <p className="text-gray-500 text-sm mt-1">In the last 7 days</p>
              </div>
            </div>

            {/* Last Login Info */}
            {securityData?.last_login && (
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="font-semibold mb-3">Last Login</h3>
                <p className="text-gray-400">
                  {new Date(securityData.last_login).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === '2fa' && (
          <TwoFactorSetup onUpdate={fetchSecurityOverview} />
        )}

        {activeTab === 'api-keys' && (
          <APIKeysManager />
        )}

        {activeTab === 'ip-whitelist' && (
          <IPWhitelist />
        )}

        {activeTab === 'activity' && (
          <AuditLogs />
        )}
      </div>
    </div>
  );
};

export default SecurityPage;