'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

type AuditLog = {
  id: string;
  fileName: string;
  hash: string;
  status: 'valid' | 'tampered';
  timestamp: string;
};

export default function Dashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    axios.get('/api/logs').then((res) => setLogs(res.data));
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post('/api/verify', formData);
    setLogs([...logs, response.data.log]);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">SFIM Dashboard</h1>
      
      <div className="mb-8">
        <input 
          type="file" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="border p-2 mr-2"
        />
        <button 
          onClick={handleUpload}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Verify File
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full ">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">File Name</th>
              <th className="py-2 px-4 border-b">Hash</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="py-2 px-4 border-b">{log.fileName}</td>
                <td className="py-2 px-4 border-b font-mono text-sm">
                  {log.hash.slice(0, 16)}...
                </td>
                <td className="py-2 px-4 border-b">
                  <span 
                    className={`px-2 py-1 rounded ${
                      log.status === 'valid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {log.status}
                  </span>
                </td>
                <td className="py-2 px-4 border-b">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}