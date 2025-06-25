// LoadingOverlay.tsx
import React from 'react';
import { useLoading } from './LoadingContext';

const LoadingOverlay: React.FC = () => {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <h3 className="text-lg font-semibold text-gray-800">Loading...</h3>
        <p className="text-sm text-gray-600">The server is spinning up (up to 50 seconds). Please be patient!</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;