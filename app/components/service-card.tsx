"use client"

import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Smartphone, Wifi, Lightbulb, Tv, CreditCard, GraduationCap, Car, Building } from "lucide-react"

const services = [
  {
    id: 1,
    title: "Airtime Top up",
    description: "Buy Airtime",
    icon: Smartphone,
    color: "bg-green-50 text-green-600",
    buttonColor: "bg-[#C29307] hover:bg-[#C29307]",
  },
  {
    id: 2,
    title: "Internet Top up",
    description: "Buy Data",
    icon: Wifi,
    color: "bg-blue-50 text-blue-600",
    buttonColor: "bg-[#C29307] hover:bg-[#C29307]",
  },
  {
    id: 3,
    title: "Power Payment",
    description: "Pay Electricity",
    icon: Lightbulb,
    color: "bg-yellow-50 text-yellow-600",
    buttonColor: "bg-[#C29307] hover:bg-[#C29307]",
  },
  {
    id: 4,
    title: "Pay Cable/TV",
    description: "Pay TV Subscription",
    icon: Tv,
    color: "bg-purple-50 text-purple-600",
    buttonColor: "bg-[#C29307] hover:bg-[#C29307]",
  },
  {
    id: 5,
    title: "Create Invoice",
    description: "Generate invoice",
    icon: CreditCard,
    color: "bg-red-50 text-red-600",
    buttonColor: "bg-[#C29307] hover:bg-[#C29307]",
  },
  {
    id: 6,
    title: "Legal Contract",
    description: "Generate Contract",
    icon: GraduationCap,
    color: "bg-indigo-50 text-indigo-600",
    buttonColor: "bg-[#C29307] hover:bg-[#C29307]",
  },
  {
    id: 7,
    title: "Ai Acountant",
    description: "Acounting Assistance",
    icon: GraduationCap,
    color: "bg-indigo-50 text-indigo-600",
    buttonColor: "bg-[#C29307] hover:bg-[#C29307]",
  },
  

]

export default function ServiceCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {services.map((service) => (
        <Card
          key={service.id}
          className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100"
        >
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${service.color}`}>
                <service.icon className="w-8 h-8" />
              </div>

              {/* Title */}
              <h3 className="font-semibold text-gray-900 text-lg">{service.title}</h3>

              {/* Action Button */}
              <Button
                className={`w-full text-white  text-sm py-2 px-4 rounded-lg cursor-pointer ${service.buttonColor}`}
                onClick={() => console.log(`Clicked ${service.title}`)}
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
