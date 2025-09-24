import React from 'react';
import FinancePanel from '../components/Finance/FinancePanel';

const Finance = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión Financiera</h1>
      <div className="bg-white shadow-md rounded-lg p-4">
        <FinancePanel />
      </div>
    </div>
  );
};

export default Finance;
