"use client";
import { GiReceiveMoney } from "react-icons/gi";
import { FaRegMoneyBillAlt } from "react-icons/fa";
import { BiUserPlus } from "react-icons/bi";
import { GiNetworkBars } from "react-icons/gi";
import { FaCoins } from "react-icons/fa";
import { BsPeople } from "react-icons/bs";
import { CgTemplate } from "react-icons/cg";
import { MdOutlineGroups2 } from "react-icons/md";
import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  XAxis,
} from "recharts";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const Home: React.FC<any> = ({
  totalUsers,
  analyticsData = [],
  CompletedContracts,
  subscribers,
  newSignups,
  handleDateRangeChange,
  dateRange,
}) => {

  console.log(analyticsData);

  const cardData = [
    {
      title: "Total Active Users",
      icon: <BsPeople />,
      value: totalUsers,
      link: "/admin",
    },
    {
      title: "Total New Sign-ups",
      icon: <MdOutlineGroups2 />,
      value: newSignups?.count ?? 0,
      link: "/admin",
    },
    {
      title: "Total Templates",
      icon: <CgTemplate />,
      value: "17",
      link: "/admin/templates",
    },
  ];

  const totalAppUsageCount = analyticsData
    ?.filter((data: any) => data.eventName === "user_engagement" && data.eventCount)
    .reduce((total: number, data: any) => total + (Number(data.eventCount) || 0), 0) || 0;

  // console.log(totalAppUsageCount);

  const totalContractActivityCount = analyticsData
    ?.filter((data: any) => data.pagePath.includes("/contracts") && data.eventCount)
    .reduce((total: number, data: any) => total + (Number(data.eventCount) || 0), 0) || 0;
  // console.log(totalContractActivityCount);

  const calculateMetrics = (
    data: { pagePath: string; eventCount: string }[],
    pathPrefix: string
  ) => {
    if (!Array.isArray(data)) return 0; // Check if data is an array
    return data
      .filter((item) => item.pagePath.startsWith(pathPrefix))
      .reduce((total, item) => total + parseInt(item.eventCount, 10), 0);
  };

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const generateData = (
    baseAppUsage: number,
    baseContractsActivity: number,
    newSignupsCount: number
  ) =>
    daysOfWeek.map((day, index) => ({
      name: day,
      total: baseAppUsage + baseContractsActivity + newSignupsCount + index * 10,
      appUsage: baseAppUsage + index * 5,
      contractActivity: baseContractsActivity + index * 8,
      newSignups: newSignupsCount,
    }));

  const [data, setData] = useState(
    generateData(
      calculateMetrics(analyticsData, "/admin"),
      calculateMetrics(analyticsData, "/contracts"),
      newSignups?.count || 0
    )
  );


  useEffect(() => {
    if (dateRange) {
      setData(generateData(totalAppUsageCount, totalContractActivityCount, newSignups?.count || 0));
    }
  }, [dateRange, newSignups]);


  return (
    <div className="p-5 flex flex-col gap-5 mb-20 md:mb-0">
      <div className="flex flex-col md:flex-row gap-3">
        {cardData.map((data, index) => (
          <div
            key={index}
            className="border flex md:flex-col justify-between md:justify-start items-center md:items-start p-5 rounded-md w-full md:h-[100px]"
          >
            <div className="flex flex-col md:flex-row items-start md:items-start gap-2">
              <span>{data.icon}</span>
              <p>{data.title}</p>
            </div>
            <h3 className="font-semibold text-3xl my-3">{data.value}</h3>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-5">
        <div className="flex flex-col w-full border p-5 rounded-md">
          <div className="flex items-center justify-between mb-3 gap-3">
            <h2 className="flex items-center gap-2">
              <GiNetworkBars /> Engagement Metric
            </h2>
            <Select value={dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Date Range</SelectLabel>
                  <SelectItem value="last90min">Last 90 Minutes</SelectItem>
                  <SelectItem value="last60min">Last 60 Minutes</SelectItem>
                  <SelectItem value="last24hrs">Last 24 Hours</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Bar
                name="App Usage"
                dataKey="appUsage"
                fill="#adfa1d"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                name="Contract Activity"
                dataKey="contractActivity"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                name="Sign-ups"
                dataKey="signups"
                fill="#000000"
                radius={[4, 4, 0, 0]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span>{value}</span>}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-8 md:w-[40%] w-full flex flex-col justify-start border rounded-md p-5">
          <h2 className="flex items-center gap-3 text-xl">
            <FaCoins /> Total Transaction
          </h2>
          <div className="flex items-start">
            <div className="space-y-1">
              <p className="font-medium leading-none flex items-center">
                <BiUserPlus className="mr-3" />
                Contract creation
              </p>
              <p className="text-2xl text-muted-foreground">
                {CompletedContracts?.contracts.toLocaleString()}
              </p>
            </div>
            <div className="ml-auto font-medium">
              +₦{CompletedContracts?.totalRevenue.toLocaleString()}
            </div>
          </div>
          <div className="flex items-start">
            <div className="space-y-1">
              <p className="font-medium leading-none flex items-center">
                <FaRegMoneyBillAlt className="mr-3" />
                Payments
              </p>
              <p className="text-2xl text-muted-foreground">1,000</p>
            </div>
            <div className="ml-auto font-medium ">+₦39.00</div>
          </div>
          <div className="flex items-start">
            <div className="space-y-1">
              <p className="font-medium leading-none flex items-center ">
                <GiReceiveMoney className="mr-3" />
                Subscription
              </p>
              <p className="text-muted-foreground text-2xl">
                {subscribers?.totalSubscribers.toLocaleString()}
              </p>
            </div>
            <div className="ml-auto font-medium">
              +₦{subscribers?.totalAmount.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
