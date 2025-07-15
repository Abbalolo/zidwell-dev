"use client";
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

interface BillTableSectionProps {
  title: string;
  icon: React.ReactNode;
  plans: any[];
}

const BillTableSection: React.FC<BillTableSectionProps> = ({
  title,
  icon,
  plans
}) => {

    const router = useRouter();
  const handleSelectPlan = (plan: any) => {
    console.log(`Selected plan: ${plan.name} from ${plan.provider}`);
    router.push("/auth/login")
  };

  return (
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        {icon}
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      
      {/* Mobile Card Layout */}
      <div className="block md:hidden space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-900">{plan.provider}</h3>
                <p className="text-sm text-gray-600">{plan.name}</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {plan.type}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Price:</span>
                <span className="font-semibold text-green-600">{plan.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Duration:</span>
                <span className="text-sm">{plan.duration}</span>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {plan.description}
              </div>
            </div>
            
            <Button 
              size="sm" 
              onClick={() => handleSelectPlan(plan)}
              className="w-full bg-[#C29307] hover:bg-[#C29307]"
            >
              Select
            </Button>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Provider</TableHead>
                <TableHead className="whitespace-nowrap">Plan Name</TableHead>
                <TableHead className="whitespace-nowrap">Type</TableHead>
                <TableHead className="whitespace-nowrap">Price</TableHead>
                <TableHead className="whitespace-nowrap">Duration</TableHead>
                <TableHead className="whitespace-nowrap">Description</TableHead>
                <TableHead className="whitespace-nowrap">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium whitespace-nowrap">{plan.provider}</TableCell>
                  <TableCell className="whitespace-nowrap">{plan.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                      {plan.type}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold text-green-600 whitespace-nowrap">{plan.price}</TableCell>
                  <TableCell className="whitespace-nowrap">{plan.duration}</TableCell>
                  <TableCell className="text-gray-600 max-w-xs truncate">{plan.description}</TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      onClick={() => handleSelectPlan(plan)}
                      className="bg-[#C29307] hover:bg-[#C29307] whitespace-nowrap"
                    >
                      Select
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default BillTableSection;