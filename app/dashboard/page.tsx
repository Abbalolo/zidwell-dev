"use client";
import { useEffect, useState } from "react";
import BalanceCard from "../components/Balance-card";
import DashboardHeader from "../components/dashboard-hearder";
import DashboardSidebar from "../components/dashboard-sidebar";
import ServiceCards from "../components/service-card";
import TransactionHistory from "../components/transaction-history";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useUserContextData } from "../context/userData";


export default function DashboardPage() {


  return (
    <div className="min-h-screen bg-gray-50 fade-in overflow-x-hidden">
      <DashboardSidebar />
      <div className="lg:ml-64">
        <DashboardHeader />
        <main className="p-5">
          <div className="md:max-w-6xl md:mx-auto space-y-8">
            {/* Welcome Message */}
            {/* If you want modal after verification */}
            {/* {userData?.bvnVerification === "verified" && (
              <AdditionalInfoModal setShowModal={setShowModal} />
            )} */}

            <div className="text-center">
              <h1 className="md:text-3xl text-xl font-bold text-gray-900 mb-2">
                Welcome to <span className="text-[#C29307]">Zidwell,</span> the
                most reliable platform for your
              </h1>
              <p className="md:text-xl text-gray-600">
                Data Bundle, Airtime, Bill Payments...
              </p>
            </div>


            {/* Balance Section */}
            <BalanceCard />

            {/* Service Cards */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Our Services
              </h2>
              <ServiceCards />
            </div>

            {/* Transaction History */}
            <TransactionHistory />
          </div>
        </main>
      </div>
    </div>
  );
}
