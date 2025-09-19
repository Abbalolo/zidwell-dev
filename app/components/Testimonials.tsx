import { Card, CardContent } from "./ui/card";
import { Star } from "lucide-react";
// import image4 from "/zid-pic/image4.jpg";
// import image15 from "/zid-pic/image15.jpg";
// import image13 from "/zid-pic/image13.jpg";
import Image from "next/image";
const Testimonials = () => {
  const testimonials: any = [
    {
      name: "Adebayo Johnson",
      role: "Small Business Owner",
      company: "Lagos",
      image: "/zid-pic/image15.jpg",
      content:
        "Zidwell has made paying my business electricity bills so much easier. I can now focus on growing my business instead of worrying about bill payments.",
      rating: 3,
    },
    {
      name: "Fatima Abdullahi",
      role: "Teacher",
      company: "Abuja",
      image:
        "https://images.unsplash.com/photo-1639702259398-73fc596690bc?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YmxhY2slMjBwZW9wbGUlMjB3aXRoJTIwaGlqYWJ8ZW58MHx8MHx8fDA%3D",
      content:
        "I love how I can pay all my family's bills from one place. The reminders ensure I never miss a payment, and the interface is so user-friendly.",
      rating: 5,
    },
    {
      name: "Chinedu Okafor",
      role: "IT Consultant",
      company: "Port Harcourt",
      image: "/zid-pic/image4.jpg",
      content:
        "The AI accountant feature is a game-changer for my freelance business. It helps me track expenses and create professional invoices effortlessly.",
      rating: 4,
    },
    {
      name: "Kemi Adebayo",
      role: "Restaurant Owner",
      company: "Ibadan",
      image:
        "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGJsYWNrJTIwcGVvcGxlfGVufDB8fDB8fHww",
      content:
        "Zidwell's bulk payment feature saves me hours every month. I can pay for cable TV, internet, and electricity for all my branches at once.",
      rating: 3,
    },
    {
      name: "Ibrahim Musa",
      role: "University Student",
      company: "Kano",
      image:
        "https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjN8fGJsYWNrJTIwcGVvcGxlfGVufDB8fDB8fHww",
      content:
        "As a student, I need to manage my finances carefully. Zidwell helps me buy data and airtime at great rates, and I can track all my spending.",
      rating: 5,
    },
    {
      name: "Grace Onyeka",
      role: "Entrepreneur",
      company: "Enugu",
      image: "/zid-pic/image13.jpg",
      content:
        "The customer support is exceptional. Whenever I have an issue, they resolve it quickly. Zidwell has truly simplified my life.",
      rating: 3,
    },
  ];

  return (
    <section data-aos="fade-up" id="testimonials" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Loved by
            <span className="ml-2 text-[#C29307]">Users Everywhere</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join over 5k+ satisfied users who trust Zidwell for all their bill
            payment needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial: any, index: any) => (
            <Card
              key={index}
              className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>

                <p className="text-gray-600 mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center">
                  <Image
                    width={32}
                    height={32}
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4 object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
