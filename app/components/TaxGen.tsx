"use client";

import { useEffect, useState } from "react";
import { Plus, Search, MoreHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useUserContextData } from "../context/userData";
import TaxList from "./TaxList";

export interface TaxFiling {
  id: string;
  user_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  company_name: string;
  business_address: string;
  nin: string;
  address_proof_url?: string;
  id_card_url?: string;
  bank_statement_url?: string;
  filing_type: "first-time" | "returning";
  created_at: string;
  status?: "pending" | "Completed";
}

export default function TaxFilingGen() {
  const [taxFilings, setTaxFilings] = useState<TaxFiling[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("filings");
  const { userData } = useUserContextData();
  const [error, setError] = useState<string | null>(null);

  // ✅ fetch tax filings
  const fetchTaxFilings = async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      if (!userId) throw new Error("User ID is required to fetch filings");

      const res = await fetch("/api/get-taxs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || "Failed to fetch tax filings");
      }

      const data = await res.json();
      if (!Array.isArray(data.receipts)) {
        throw new Error("Invalid data structure received from server");
      }

      setTaxFilings(data.receipts);
    } catch (err: any) {
      console.error("Error fetching tax filings:", err);
      setError(
        err.message || "Something went wrong while fetching tax filings"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.id) {
      fetchTaxFilings(userData.id);
    }
  }, [userData?.id]);

  // ✅ filtered filings
  const filteredFilings = taxFilings.filter((item) => {
    const status = item.status?.toLowerCase().trim() || "";

    const statusMatch =
      selectedStatus === "all" ? true : status === selectedStatus.toLowerCase();

    const searchMatch =
      searchTerm === "" ||
      item.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nin?.toLowerCase().includes(searchTerm.toLowerCase());

    return statusMatch && searchMatch;
  });

  const statusOptions = ["All", "Pending", "Completed"];

  return (
    <div className="space-y-6 p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-2 mb-4">
          <TabsTrigger value="filings">All Tax Filings</TabsTrigger>
        </TabsList>

        <TabsContent value="filings" className="space-y-6">
          {/* Search + Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full relative flex gap-3 md:justify-between">
                  <div className="w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search filings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>

                  {/* Status filter */}
                  <div className="flex flex-wrap gap-2">
                    <div className="hidden sm:flex gap-2">
                      {statusOptions.map((status) => {
                        const lowercase = status.toLowerCase();
                        const isActive = selectedStatus === lowercase;

                        return (
                          <Button
                            key={status}
                            size="sm"
                            variant="outline" 
                            className={`border transition-all duration-300 ${
                              isActive
                                ? "bg-[#C29307] text-white hover:bg-[#b18205]" 
                                : "hover:bg-[#C29307] hover:text-white"
                            }`}
                            onClick={() => setSelectedStatus(lowercase)}
                          >
                            {status}
                          </Button>
                        );
                      })}
                    </div>

                    {/* Mobile dropdown */}
                    <div className="sm:hidden">
                      <Button
                        onClick={() => setIsMenuOpen((prev) => !prev)}
                        className="p-2 hover:bg-black "
                      >
                        <MoreHorizontal className="w-4 h-4 text-white" />
                      </Button>

                      {isMenuOpen && (
                        <div className="absolute right-0 bg-white shadow-md rounded-lg mt-2 p-2 border border-gray-200 w-40">
                          {statusOptions.map((status) => {
                            const lowercase = status.toLowerCase();
                            return (
                              <Button
                                key={status}
                                variant={
                                  selectedStatus === lowercase
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                className="w-full text-left p-2 hover:bg-[#C29307] hover:text-white mb-1"
                                onClick={() => {
                                  setSelectedStatus(lowercase);
                                  setIsMenuOpen(false);
                                }}
                              >
                                {status}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filing list */}
          <TaxList taxFiling={filteredFilings} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
