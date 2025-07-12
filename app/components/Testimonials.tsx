
import { Card, CardContent } from "./ui/card";
import { Star } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Adebayo Johnson",
      role: "Small Business Owner",
      company: "Lagos",
      image: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YmxhY2slMjBwZW9wbGV8ZW58MHx8MHx8fDA%3D",
      content: "Zidwell has made paying my business electricity bills so much easier. I can now focus on growing my business instead of worrying about bill payments.",
      rating: 5
    },
    {
      name: "Fatima Abdullahi",
      role: "Teacher",
      company: "Abuja",
      image: "https://images.unsplash.com/photo-1639702259398-73fc596690bc?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YmxhY2slMjBwZW9wbGUlMjB3aXRoJTIwaGlqYWJ8ZW58MHx8MHx8fDA%3D",
      content: "I love how I can pay all my family's bills from one place. The reminders ensure I never miss a payment, and the interface is so user-friendly.",
      rating: 5
    },
    {
      name: "Chinedu Okafor",
      role: "IT Consultant",
      company: "Port Harcourt",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      content: "The AI accountant feature is a game-changer for my freelance business. It helps me track expenses and create professional invoices effortlessly.",
      rating: 5
    },
    {
      name: "Kemi Adebayo",
      role: "Restaurant Owner",
      company: "Ibadan",
      image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGJsYWNrJTIwcGVvcGxlfGVufDB8fDB8fHww",
      content: "Zidwell's bulk payment feature saves me hours every month. I can pay for cable TV, internet, and electricity for all my branches at once.",
      rating: 5
    },
    {
      name: "Ibrahim Musa",
      role: "University Student",
      company: "Kano",
      image: "https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjN8fGJsYWNrJTIwcGVvcGxlfGVufDB8fDB8fHww",
      content: "As a student, I need to manage my finances carefully. Zidwell helps me buy data and airtime at great rates, and I can track all my spending.",
      rating: 5
    },
    {
      name: "Grace Onyeka",
      role: "Entrepreneur",
      company: "Enugu",
      image: "https://images.unsplash.com/photo-1632765854612-9b02b6ec2b15?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjh8fGJsYWNrJTIwcGVvcGxlfGVufDB8fDB8fHww",
      content: "The customer support is exceptional. Whenever I have an issue, they resolve it quickly. Zidwell has truly simplified my life.",
      rating: 5
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Loved by
            <span className="ml-2 text-[#C29307]">
              Users Everywhere
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join over 50,000+ satisfied users who trust Zidwell for all their bill payment needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-gray-600 mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4 object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:space-x-8 text-gray-500">
            <div className="flex items-center">
              <span className="text-3xl font-bold text-gray-900">50,000+</span>
              <span className="ml-2">Happy Users</span>
            </div>
            <div className="flex items-center">
              <span className="text-3xl font-bold text-gray-900">99.9%</span>
              <span className="ml-2">Uptime</span>
            </div>
            <div className="flex items-center">
              <span className="text-3xl font-bold text-gray-900">4.9★</span>
              <span className="ml-2">User Rating</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
