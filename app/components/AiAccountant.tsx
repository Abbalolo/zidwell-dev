"use client"

import { useState } from "react"
import { Bot, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Send, Mic } from "lucide-react"
import { Button } from "./ui/button" 
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"

interface ChatMessage {
  id: string
  type: "user" | "ai"
  message: string
  timestamp: Date
}

const insights = [
  {
    title: "Revenue Growth",
    value: "+23.5%",
    description: "Compared to last month",
    icon: TrendingUp,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    title: "Expense Reduction",
    value: "-12.3%",
    description: "Operating costs decreased",
    icon: TrendingDown,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Profit Margin",
    value: "34.2%",
    description: "Above industry average",
    icon: DollarSign,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    title: "Cash Flow",
    value: "Healthy",
    description: "Positive trend maintained",
    icon: BarChart3,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
]

const recommendations = [
  {
    title: "Optimize Payment Terms",
    description: "Consider reducing payment terms from 30 to 15 days to improve cash flow",
    priority: "High",
    impact: "₦2.5M monthly improvement",
  },
  {
    title: "Diversify Revenue Streams",
    description: "Explore additional services like insurance payments to reduce dependency",
    priority: "Medium",
    impact: "15-20% revenue increase potential",
  },
  {
    title: "Automate Recurring Expenses",
    description: "Set up automated payments for utilities and subscriptions",
    priority: "Low",
    impact: "5% cost reduction",
  },
]

export default function AIAccountant() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "ai",
      message:
        "Hello! I'm your AI Accountant. I can help you with financial analysis, budgeting, tax planning, and business insights. What would you like to know about your finances today?",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")

  const sendMessage = () => {
    if (!inputMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      message: inputMessage,
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        message: getAIResponse(inputMessage),
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, aiResponse])
    }, 1000)

    setInputMessage("")
  }

  const getAIResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase()
    if (lowerMessage.includes("revenue") || lowerMessage.includes("income")) {
      return "Your revenue has grown by 23.5% this month! The main drivers are increased transaction volumes in airtime and data services. I recommend focusing on customer retention strategies to maintain this growth."
    }
    if (lowerMessage.includes("expense") || lowerMessage.includes("cost")) {
      return "Your expenses have decreased by 12.3% compared to last month. This is mainly due to optimized operational costs. I suggest maintaining this trend by automating more processes."
    }
    if (lowerMessage.includes("tax")) {
      return "Based on your current revenue, you should set aside approximately ₦850,000 for tax obligations this quarter. I can help you optimize your tax strategy through legitimate deductions."
    }
    return "I understand you're asking about your finances. Could you be more specific? I can help with revenue analysis, expense tracking, tax planning, cash flow management, or financial forecasting."
  }

  return (
    <div className="space-y-6">
      {/* AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {insights.map((insight, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${insight.bgColor}`}>
                  <insight.icon className={`w-6 h-6 ${insight.color}`} />
                </div>
                <Badge variant="secondary">AI Insight</Badge>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{insight.title}</h3>
              <p className={`text-2xl font-bold mb-1 ${insight.color}`}>{insight.value}</p>
              <p className="text-sm text-gray-600">{insight.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Chat */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />
              AI Financial Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg">
                {chatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-900 border border-gray-200"
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${message.type === "user" ? "text-blue-100" : "text-gray-500"}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Ask me about your finances..."
                  value={inputMessage}
                  onChange={(e:any) => setInputMessage(e.target.value)}
                  onKeyPress={(e:any) => e.key === "Enter" && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!inputMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
                <Button variant="outline">
                  <Mic className="w-4 h-4" />
                </Button>
              </div>

              {/* Quick Questions */}
              <div className="flex flex-wrap gap-2">
                {["Revenue analysis", "Tax planning", "Cash flow", "Expense optimization"].map((question) => (
                  <Button key={question} variant="outline" size="sm" onClick={() => setInputMessage(question)}>
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-600" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{rec.title}</h4>
                    <Badge
                      variant={
                        rec.priority === "High" ? "destructive" : rec.priority === "Medium" ? "default" : "secondary"
                      }
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                  <p className="text-sm font-medium text-green-600">{rec.impact}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Financial Health Score */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="relative w-32 h-32 mx-auto">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">85</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">Excellent</p>
                <p className="text-sm text-gray-600">Your financial health is above average</p>
              </div>
              <div className="space-y-2 text-left">
                <div className="flex justify-between text-sm">
                  <span>Cash Flow</span>
                  <span className="text-green-600">90%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Profitability</span>
                  <span className="text-green-600">85%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Growth Rate</span>
                  <span className="text-blue-600">80%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Risk Management</span>
                  <span className="text-yellow-600">75%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
