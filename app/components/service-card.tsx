"use client"

import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Smartphone, Wifi, Lightbulb, Tv, CreditCard, Scale, Bot, Receipt, FileSpreadsheet } from "lucide-react"
import { link } from "fs"

const services:any = [
   {
    id: 1,
    title: "Tax Filing",
    description: "File your tax",
    icon: FileSpreadsheet ,
    color: "bg-gray-50 text-gray-600",
    buttonColor: "bg-[#C29307] hover:bg-[#C29307]",
    link: "/dashboard/services/tax-filing"
  },
   {
    id: 2,
    title: "Simple Agreement",
    description: "Generate Agreement",
    icon: Scale,
    color: "bg-indigo-50 text-indigo-600",
    buttonColor: "bg-[#C29307] hover:bg-[#C29307]",
    link: "/dashboard/services/simple-agreement"
  },
    {
    id: 3,
    title: "Create Receipt",
    description: "Generate Receipt",
    icon: Receipt,
    color: "bg-red-50 text-red-600",
    buttonColor: "bg-[#C29307] hover:bg-[#C29307]",
    link: "/dashboard/services/create-receipt"
  },
 
 
  {
    id: 4,
    title: "Airtime Top up",
    description: "Buy Airtime",
    icon: Smartphone,
    color: "bg-green-50 text-green-600",
    buttonColor: "bg-[#C29307] hover:bg-[#C29307]",
    link: "/dashboard/services/buy-airtime"
  },
  {
    id: 5,
    title: "Internet Top up",
    description: "Buy Data",
    icon: Wifi,
    color: "bg-blue-50 text-blue-600",
    buttonColor: "bg-[#C29307] hover:bg-[#C29307]",
    link: "/dashboard/services/buy-data"
  },
  {
    id: 6,
    title: "Electricity Payment",
    description: "Pay Electricity",
    icon: Lightbulb,
    color: "bg-yellow-50 text-yellow-600",
    buttonColor: "bg-[#C29307] hover:bg-[#C29307]",
    link: "/dashboard/services/buy-power"
  },
  {
    id: 7,
    title: "Pay Cable/TV",
    description: "Pay TV Subscription",
    icon: Tv,
    color: "bg-purple-50 text-purple-600",
    buttonColor: "bg-[#C29307] hover:bg-[#C29307]",
    link: "/dashboard/services/buy-cable-tv"
  },
  {
    id: 8,
    title: "Create Invoice",
    description: "Generate invoice",
    icon: CreditCard,
    color: "bg-red-50 text-red-600  ",
    buttonColor: "bg-[#C29307] hover:bg-[#C29307]",
    link: "/dashboard/services/create-invoice"
  },

  

]

export default function ServiceCards() {
  const router = useRouter()
  return (
    <div className="grid grid-cols-2  lg:grid-cols-4 md:gap-6 gap-3">
      {services.map((service :any) => (
        <Card
         onClick={() => router.push(service.link)}
          key={service.id}
          className=" shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100"
        >
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${service.color}`}>
                <service.icon className="md:w-8 md:h-8 w-5 h-5" />
              </div>

              {/* Title */}
              <h3 className="font-semibold text-gray-900 text-sm md:text-lg">{service.title}</h3>

              {/* Action Button */}
              <Button
                className={`w-full text-white  text-sm py-2 px-4 rounded-lg cursor-pointer ${service.buttonColor} hidden md:block`}
                onClick={() => router.push(service.link)}
              >
                {service.description}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
