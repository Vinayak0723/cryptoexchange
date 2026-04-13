import React, { useState, useEffect } from 'react';
import { KeyIcon, PlusIcon, TrashIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import securityService from '../../services/securityService';

const APIKeysManager = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', permissions: 'read' });

  useEffect(() => { fetchKeys(); }, []);

  const fetchKeys = async () => {
    try {
      const data = await securityService.getAPIKeys();
      setApiKeys(data);
    } catch (e) { setApiKeys([]); }
    setLoading(false);
  };

  const createKey = async () => {
    if (!form.name) return setError('Enter a name');
    try {
      const data = await securityService.createAPIKey(form);
      setNewKey(data);
      setShowModal(false);
      setForm({ name: '', permissions: 'read' });
      fetchKeys();
    } catch (e) { setError('Failed to create key'); }
  };

  const deleteKey = async (id) => {
    if (!window.confirm('Delete this key?')) return;
    await securityService.deleteAPIKey(id);
    fetchKeys();
  };

  const copy = (text) => navigator.clipboard.writeText(text);

  if (loading) return <div className="text-center py-12"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" /></div>;

  return (
    <div>
      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">{error}</div>}

      {newKey && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-lg w-full border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-green-400">✓ API Key Created!</h2>
            <p className="text-yellow-400 text-sm mb-4">Save your secret now - it won't be shown again!</p>
            <div className="space-y-3 mb-4">
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">API Key</div>
                <div className="font-mono text-sm text-green-400 flex justify-between">
                  <span className="break-all">{newKey.key}</span>
                  <button onClick={() => copy(newKey.key)}><ClipboardDocumentIcon className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Secret Key</div>
                <div className="font-mono text-sm text-yellow-400 flex justify-between">
                  <span className="break-all">{newKey.secret}</span>
                  <button onClick={() => copy(newKey.secret)}><ClipboardDocumentIcon className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
            <button onClick={() => setNewKey(null)} className="w-full py-3 bg-blue-600 rounded-xl font-semibold">Done</button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Create API Key</h2>
            <div className="space-y-4">
              <input
                placeholder="Key name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-blue-500 focus:outline-none"
              />
              <select
                value={form.permissions}
                onChange={(e) => setForm({ ...form, permissions: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-blue-500 focus:outline-none"
              >
                <option value="read">Read Only</option>
                <option value="trade">Trading</option>
                <option value="withdraw">Withdraw</option>
                <option value="full">Full Access</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-800 rounded-xl">Cancel</button>
              <button onClick={createKey} className="flex-1 py-3 bg-blue-600 rounded-xl font-semibold">Create</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">API Keys</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-xl">
          <PlusIcon className="w-5 h-5" /> Create Key
        </button>
      </div>

      {apiKeys.length === 0 ? (
        <div className="bg-gray-900 rounded-xl p-12 text-center border border-gray-800">
          <KeyIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No API keys yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <div key={key.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{key.name}</h3>
                <p className="text-sm text-gray-500 font-mono">{key.key_preview}</p>
                <p className="text-xs text-gray-600 mt-1">Permissions: {key.permissions}</p>
              </div>
              <button onClick={() => deleteKey(key.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg">
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default APIKeysManager;