

export const billProviders: any = {
  airtime: [
    {
      name: "Airtel Airtime VTU",
      description: "Airtel airtime - Get instant top up",
      logo: "/placeholder.svg",
      color: "#E60000",
      bgColor: "bg-red-50"
    },
    {
      name: "MTN Airtime VTU",
      description: "MTN airtime - Get instant top up",
      logo: "/placeholder.svg",
      color: "#FFCB05",
      bgColor: "bg-yellow-50"
    },
    {
      name: "GLO Airtime VTU",
      description: "GLO airtime - Get instant top up",
      logo: "/placeholder.svg",
      color: "#00A651",
      bgColor: "bg-green-50"
    },
    {
      name: "9Mobile Airtime VTU",
      description: "9Mobile airtime - Get instant top up",
      logo: "/placeholder.svg",
      color: "#00A651",
      bgColor: "bg-green-50"
    },
    {
      name: "Smile Network payment",
      description: "Smile airtime - Get instant top up",
      logo: "/placeholder.svg",
      color: "#7B68EE",
      bgColor: "bg-purple-50"
    },
    {
      name: "Smile Airtime",
      description: "Smile airtime - Get instant top up",
      logo: "/placeholder.svg",
      color: "#7B68EE",
      bgColor: "bg-purple-50"
    }
  ],
  data: [
    {
      name: "Airtel Data",
      description: "Airtel airtime - Get instant top up",
      logo: "/placeholder.svg",
      color: "#E60000",
      bgColor: "bg-red-50"
    },
    {
      name: "MTN Data",
      description: "MTN Data - Get instant top up",
      logo: "/placeholder.svg",
      color: "#FFCB05",
      bgColor: "bg-yellow-50"
    },
    {
      name: "GLO Data",
      description: "GLO data - Get instant top up",
      logo: "/placeholder.svg",
      color: "#00A651",
      bgColor: "bg-green-50"
    },
    {
      name: "9Mobile Data",
      description: "9Mobile Data - Instant Data top up",
      logo: "/placeholder.svg",
      color: "#00A651",
      bgColor: "bg-green-50"
    },
    {
      name: "Spectranet Internet Data",
      description: "Pay for Spectranet Internet Data",
      logo: "/placeholder.svg",
      color: "#1E3A8A",
      bgColor: "bg-blue-50"
    },
    {
      name: "Smile Network Payment",
      description: "Smile Airtime and Internet Data",
      logo: "/placeholder.svg",
      color: "#00A651",
      bgColor: "bg-green-50"
    }
  ],
  tv: [
    {
      name: "Gotv Payment",
      description: "Choose from a range of GOtv bouquets for your entertainment.",
      logo: "/placeholder.svg",
      color: "#00A651",
      bgColor: "bg-green-50"
    },
    {
      name: "DStv Subscription",
      description: "Choose from a range of DStv bouquets for your entertainment.",
      logo: "/placeholder.svg",
      color: "#0074D9",
      bgColor: "bg-blue-50"
    },
    {
      name: "Showmax",
      description: "ShowMax viewing subscription bouquets for your entertainment.",
      logo: "/placeholder.svg",
      color: "#000000",
      bgColor: "bg-gray-50"
    },
    {
      name: "Startime Subscription",
      description: "Choose from a range of DStv bouquets for your entertainment.",
      logo: "/placeholder.svg",
      color: "#0074D9",
      bgColor: "bg-blue-50"
    }
  ],
  electricity: [
    {
      name: "Ikeja Electric Payment - IKEDC",
      description: "Pay your Ikeja Electric bills",
      logo: "/placeholder.svg",
      color: "#E60000",
      bgColor: "bg-red-50"
    },
    {
      name: "EKO Electric Payment - EKEDC",
      description: "Pay your EKO Electric bills",
      logo: "/placeholder.svg",
      color: "#1E3A8A",
      bgColor: "bg-blue-50"
    },
    {
      name: "Abuja Electricity Distribution Company",
      description: "Pay your AEDC bills",
      logo: "/placeholder.svg",
      color: "#1E3A8A",
      bgColor: "bg-blue-50"
    }
  ]
};

export const billPlans: any = {
  airtime: [
    { id: "air_1", name: "₦100 Airtime", provider: "Airtel", type: "Airtime", price: "₦100", duration: "Instant", description: "₦100 airtime top-up" },
    { id: "air_2", name: "₦200 Airtime", provider: "Airtel", type: "Airtime", price: "₦200", duration: "Instant", description: "₦200 airtime top-up" },
    { id: "air_3", name: "₦500 Airtime", provider: "Airtel", type: "Airtime", price: "₦500", duration: "Instant", description: "₦500 airtime top-up" },
    { id: "mtn_1", name: "₦100 Airtime", provider: "MTN", type: "Airtime", price: "₦100", duration: "Instant", description: "₦100 airtime top-up" },
    { id: "mtn_2", name: "₦500 Airtime", provider: "MTN", type: "Airtime", price: "₦500", duration: "Instant", description: "₦500 airtime top-up" },
    { id: "glo_1", name: "₦200 Airtime", provider: "GLO", type: "Airtime", price: "₦200", duration: "Instant", description: "₦200 airtime top-up" },
  ],
  data: [
    { id: "data_1", name: "1GB Data", provider: "Airtel", type: "Data Bundle", price: "₦350", duration: "30 days", description: "1GB monthly data plan" },
    { id: "data_2", name: "2GB Data", provider: "Airtel", type: "Data Bundle", price: "₦700", duration: "30 days", description: "2GB monthly data plan" },
    { id: "data_3", name: "5GB Data", provider: "Airtel", type: "Data Bundle", price: "₦1,500", duration: "30 days", description: "5GB monthly data plan" },
    { id: "mtn_data_1", name: "1.5GB Data", provider: "MTN", type: "Data Bundle", price: "₦500", duration: "30 days", description: "1.5GB monthly data plan" },
    { id: "mtn_data_2", name: "3GB Data", provider: "MTN", type: "Data Bundle", price: "₦1,000", duration: "30 days", description: "3GB monthly data plan" },
    { id: "glo_data_1", name: "2.5GB Data", provider: "GLO", type: "Data Bundle", price: "₦800", duration: "30 days", description: "2.5GB monthly data plan" },
  ],
  tv: [
    { id: "gotv_1", name: "GOtv Lite", provider: "GOtv", type: "Monthly Plan", price: "₦1,100", duration: "30 days", description: "Basic entertainment package" },
    { id: "gotv_2", name: "GOtv Max", provider: "GOtv", type: "Monthly Plan", price: "₦2,700", duration: "30 days", description: "Premium entertainment package" },
    { id: "dstv_1", name: "DStv Compact", provider: "DStv", type: "Monthly Plan", price: "₦7,900", duration: "30 days", description: "Standard entertainment package" },
    { id: "dstv_2", name: "DStv Premium", provider: "DStv", type: "Monthly Plan", price: "₦21,000", duration: "30 days", description: "Premium entertainment package" },
    { id: "showmax_1", name: "Showmax Mobile", provider: "Showmax", type: "Monthly Plan", price: "₦1,200", duration: "30 days", description: "Mobile streaming plan" },
    { id: "showmax_2", name: "Showmax Pro", provider: "Showmax", type: "Monthly Plan", price: "₦3,200", duration: "30 days", description: "Full streaming plan with sports" },
  ],
  electricity: [
    { id: "ikedc_1", name: "Prepaid Units", provider: "IKEDC", type: "Electricity Units", price: "Variable", duration: "As consumed", description: "Prepaid electricity units" },
    { id: "ikedc_2", name: "Postpaid Bill", provider: "IKEDC", type: "Bill Payment", price: "Variable", duration: "Monthly", description: "Monthly electricity bill payment" },
    { id: "ekedc_1", name: "Prepaid Units", provider: "EKEDC", type: "Electricity Units", price: "Variable", duration: "As consumed", description: "Prepaid electricity units" },
    { id: "aedc_1", name: "Prepaid Units", provider: "AEDC", type: "Electricity Units", price: "Variable", duration: "As consumed", description: "Prepaid electricity units" },
  ]
};
