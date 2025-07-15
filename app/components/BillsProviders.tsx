'use client';

import Image from 'next/image';
import React from 'react';

interface BillProviderCardProps {
  provider: any;
}

const BillProviderCard: React.FC<BillProviderCardProps> = ({ provider }) => {
  const handleProviderClick = () => {
    console.log(`Selected provider: ${provider.name}`);
    // Here you would typically navigate to the payment form or handle the selection
  };

  return (
    <div 
      onClick={handleProviderClick}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${provider.bgColor}`}>
           <Image 
            src={provider.logo} 
            alt={provider.name}
            className="w-8 h-8 object-contain"
            width={32}
            height={32}
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = 'none';
              const next = target.nextElementSibling;
              if (next instanceof HTMLElement) {
                next.style.display = 'flex';
              }
            }}
          />
          <div 
            className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm "
            style={{ backgroundColor: provider.color }}
          >
            {provider.name.charAt(0)}
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">{provider.name}</h3>
          <p className="text-sm text-gray-600">{provider.description}</p>
        </div>
      </div>
    </div>
  );
};

export default BillProviderCard;
