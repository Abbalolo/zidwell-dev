"use client";
import React from 'react';
import { Shield, Smartphone, Tv, Zap } from 'lucide-react';
import BillTableSection from '../components/BillTableSrction';
import { billPlans } from '../components/bills-data/billProviders';
import Header from '../components/Header';

const page = () => {
  return (
    <>
    <Header/>
     <div className="min-h-screen bg-gray-50 py-4 md:py-8 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12 pt-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Bill Payments Platform</h1>
            
          </div>
          <p className="text-gray-600 text-sm md:text-base">Select the plan you want to purchase</p>
        </div>

        {/* Airtime Recharge Section */}
        <BillTableSection
          title="Airtime Recharge"
          icon={<Smartphone className="w-5 h-5 md:w-6 md:h-6" />}
          plans={billPlans.airtime}
        />

        {/* Data Services Section */}
        <BillTableSection
          title="Data Services"
          icon={<Smartphone className="w-5 h-5 md:w-6 md:h-6" />}
          plans={billPlans.data}
        />

        {/* TV Subscription Section */}
        <BillTableSection
          title="TV Subscription"
          icon={<Tv className="w-5 h-5 md:w-6 md:h-6" />}
          plans={billPlans.tv}
        />

        {/* Electricity Bill Section */}
        <BillTableSection
          title="Electricity Bill"
          icon={<Zap className="w-5 h-5 md:w-6 md:h-6" />}
          plans={billPlans.electricity}
        />
      </div>
    </div>
    </>
   
  );
};

export default page;