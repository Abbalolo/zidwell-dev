"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "./ui/button" 
import { Card, CardContent } from "./ui/card"

export default function ReferralSection() {
  const [copied, setCopied] = useState(false)
  const referralLink = "https://aremxyplug247.com/app/register?referral=683588777d6f21729"

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy: ", err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Referral Card */}
      <Card className="bg-gray-900 text-white">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-green-400 mb-4">Refer and earn 5 zidcoin</h3>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <span className="text-gray-300">Your referral link is :</span>
              <Button
                onClick={copyToClipboard}
                variant="secondary"
                size="sm"
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    copy link
                  </>
                )}
              </Button>
            </div>

            <div className="bg-gray-800 p-3 rounded-lg">
              <p className="text-sm text-gray-300 break-all font-mono">{referralLink}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cashback Info */}
      <Card className="bg-gray-50">
        <CardContent className="p-6 text-center">
          <h4 className="font-semibold text-gray-900 mb-2">Hey ! Chukwuebuka</h4>
          <p className="text-gray-600 mb-2">Do you want a whopping Cashback ?</p>
          <p className="text-sm text-gray-500 leading-relaxed">
            Businesses earn 1 Zidcoin (worth ₦10) for every ₦1,000 spent on , redeemable for cashback or future
            savings/investments
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
