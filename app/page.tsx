'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

type AuditLog = {
  fileName: string;
  hash: string;
  valid: boolean;
  timestamp: string;
  error?: string;
};

export default function Dashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    axios.get('/api/logs').then((res) => setLogs(res.data));
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setError('');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/verify', formData);
      
      if (response.data.valid) {
        setLogs([...logs, {
          fileName: file.name,
          hash: response.data.hash,
          valid: true,
          timestamp: new Date().toLocaleString()
        }]);
      } else {
        setLogs([...logs, {
          fileName: file.name,
          hash: response.data.hash,
          valid: false,
          timestamp: new Date().toLocaleString(),
          error: response.data.error
        }]);
        setError(`Integrity check failed: ${response.data.error}`);
      }
    } catch (err) {
      setError('File verification failed. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">SFIM Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

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
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">File Name</th>
              <th className="py-2 px-4 border-b">Hash</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index}>
                <td className="py-2 px-4 border-b">{log.fileName}</td>
                <td className="py-2 px-4 border-b font-mono text-sm">
                  {log.hash.slice(0, 16)}...
                </td>
                <td className="py-2 px-4 border-b">
                  {log.valid ? (
                    <span className="text-green-600">✓ Valid</span>
                  ) : (
                    <span className="text-red-600">✗ Tampered</span>
                  )}
                </td>
                <td className="py-2 px-4 border-b">{log.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}