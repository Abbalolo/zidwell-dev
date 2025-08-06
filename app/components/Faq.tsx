"use client";

import React, { useState } from "react";

const faqData = [
  {
    question:  "Is Zidwell free to use?"
,
    answer:
      "Yes, our core payment platform is free. We only charge for premium services like the accelerator or future investment advisory."

  },
  {
    question: "Can I use Zidwell without CAC registration?"
,
    answer:
      "Yes. We welcome both registered and informal businesses. For those who need help registering, our partner program offers support."
  },
  {
    question: "Is this safe?",
    answer:
      "Absolutely. Your funds are handled by licensed partners, and we never touch your money directly. You stay in full control.",
  },
  {
    question: "What is Zidcoins used for?",
    answer:
      "Zidcoins is the means of doing all transactions on Zidwell. Every service we offer has a Zidcoin amount attached to it - from contract creation, to receipts, to our ai accountant. Buy Zidcoins from your dashboard and pay with normal bank transfer and enjoy rewards.",
  },
  {
    question: "Can I use Zidwell for multiple business branches or outlets?",
    answer:
      "Yes. Our platform allows you to manage bills across different branches and generate reports for each location",
  },
 
  {
    question: "How do I fund my Zidwell Wallet?",
    answer:
      "You do all transactions on Zidwell with Zidcoins. You buy Zidcoins from your dashboard and pay with normal bank transfer and enjoy rewards.",
  },
  {
    question: "What happens if a bill payment fails?",
    answer:
      "In rare cases of failed transactions, your wallet will be instantly refunded, and you’ll be notified to retry.",
  },
  {
    question: "Can I assign other team members to manage payments?",
    answer:
      "Yes. Zidwell allows role-based access, so you can assign your accountant or operations team to handle specific tasks.",
  },
  {
    question: "Is there a mobile app?",
    answer:
      "For now, no. But Zidwell works well on your phone through your web browser, with a tablet, or a computer. A native mobile app for iOS and Android is in development, might be available in 2026.",
  },
  {
    question: "Who do I contact for support?",
    answer:
      "We offer live chat support in-app and via email. Our support team is available Monday to Saturday, 9am to 7pm.",
  },
];

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section
    
      className=" bg-white/10 border border-gray-400 backdrop-blur-md rounded-xl px-5 py-3 cursor-pointer transition-all duration-300 ease-in-out"
      onClick={() => setOpen(!open)}
    >
      <div className="flex justify-between items-center">
        <h3 className=" font-semibold">{question}</h3>
        <span className="text-[#C29307] text-xl">{open ? "−" : "+"}</span>
      </div>
      {open && <p className=" mt-3 transition-all duration-300 ease-in-out">{answer}</p>}
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" data-aos="fade-down" className="md:px-48 md:py-14 py-10 p-6 bg-gray-50">
      <div className="flex flex-col justify-start gap-3 w-full  py-10">
        <h1 className="text-[32px] md:text-[40px]  text-center  font-bold ">
          Frequently Asked <span className="text-[#C29307]">Questions</span>
        </h1>
        <p className="text-gray-500 text-center ">
          Find answers to common questions about Zidwell
          bill payment services. 
        </p>
      </div>

      <div className="grid gap-6 mt-4">
        {faqData.map((faq, index) => (
          <FaqItem key={index} question={faq.question} answer={faq.answer} />
        ))}
      </div>

    
    </section>
  );
}

export default Faq;
