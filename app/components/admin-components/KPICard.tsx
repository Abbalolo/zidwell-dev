// components/admin-components/KPICard.tsx
import { ReactNode } from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  growth?: ReactNode;
  className?: string;
}

export default function KPICard({ title, value, growth, className = "" }: KPICardProps) {
  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border relative ${className}`}>
      <div className="text-sm text-gray-500 mb-2 flex items-center">{title}
         {growth && (
          <div className="flex-shrink-0 ml-2 text-sm">
            {growth}
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
       
      </div>
    </div>
  );
}