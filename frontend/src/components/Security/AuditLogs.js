import React, { useState, useEffect } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import securityService from '../../services/securityService';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await securityService.getAuditLogs();
        setLogs(data);
      } catch (e) { setLogs([]); }
      setLoading(false);
    };
    fetchLogs();
  }, []);

  if (loading) return <div className="text-center py-12"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" /></div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Activity Log</h2>

      {logs.length === 0 ? (
        <div className="bg-gray-900 rounded-xl p-12 text-center border border-gray-800">
          <ClockIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log, i) => (
            <div key={log.id || i} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex justify-between">
                <span className="font-semibold capitalize">{log.action?.replace(/_/g, ' ')}</span>
                <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
              </div>
              {log.ip_address && <p className="text-sm text-gray-500 mt-1">IP: {log.ip_address}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLogs;