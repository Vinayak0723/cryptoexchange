import React, { useState, useEffect } from 'react';
import { GlobeAltIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import securityService from '../../services/securityService';

const IPWhitelist = () => {
  const [ips, setIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ip_address: '', label: '' });
  const [error, setError] = useState(null);

  useEffect(() => { fetchIPs(); }, []);

  const fetchIPs = async () => {
    try {
      const data = await securityService.getIPWhitelist();
      setIps(data);
    } catch (e) { setIps([]); }
    setLoading(false);
  };

  const addIP = async () => {
    if (!form.ip_address || !form.label) return setError('Fill all fields');
    try {
      await securityService.addIPToWhitelist(form);
      setShowModal(false);
      setForm({ ip_address: '', label: '' });
      fetchIPs();
    } catch (e) { setError('Failed to add IP'); }
  };

  const removeIP = async (id) => {
    if (!window.confirm('Remove this IP?')) return;
    await securityService.removeIPFromWhitelist(id);
    fetchIPs();
  };

  if (loading) return <div className="text-center py-12"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" /></div>;

  return (
    <div>
      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">{error}</div>}

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Add IP Address</h2>
            <div className="space-y-4">
              <input
                placeholder="IP Address (e.g., 192.168.1.1)"
                value={form.ip_address}
                onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-blue-500 focus:outline-none"
              />
              <input
                placeholder="Label (e.g., Home, Office)"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-800 rounded-xl">Cancel</button>
              <button onClick={addIP} className="flex-1 py-3 bg-blue-600 rounded-xl font-semibold">Add</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">IP Whitelist</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-xl">
          <PlusIcon className="w-5 h-5" /> Add IP
        </button>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
        <p className="text-blue-400 text-sm">Withdrawals will only be allowed from whitelisted IP addresses.</p>
      </div>

      {ips.length === 0 ? (
        <div className="bg-gray-900 rounded-xl p-12 text-center border border-gray-800">
          <GlobeAltIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No whitelisted IPs</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ips.map((ip) => (
            <div key={ip.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <GlobeAltIcon className="w-8 h-8 text-green-500" />
                <div>
                  <h3 className="font-semibold">{ip.label}</h3>
                  <p className="text-sm text-gray-500 font-mono">{ip.ip_address}</p>
                </div>
              </div>
              <button onClick={() => removeIP(ip.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg">
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IPWhitelist;