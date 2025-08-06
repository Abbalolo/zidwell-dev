'use client';

import React, { useState } from 'react';

function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Sending...');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('Message sent!');
        setForm({ name: '', email: '', message: '' });
      } else {
        setStatus(data.message || 'Something went wrong.');
      }
    } catch (err) {
      setStatus('Failed to send message.');
    }
  };

  return (
    <section
      data-aos="fade-up"
      id="contact"
      className="flex items-center justify-center py-16 px-4"
    >
      <div className="w-full max-w-3xl border border-gray-300 backdrop-blur-md rounded-xl p-8 shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">
          Contact Us
        </h1>
        <p className="text-gray-500 text-center mb-10">
          Got a question, feedback, or partnership idea? We'd love to hear from you.
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm mb-1" htmlFor="name">
              Name
            </label>
            <input
              type="text"
              id="name"
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-md bg-white/5 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C29307]"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-md bg-white/5 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C29307]"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1" htmlFor="message">
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              placeholder="Your message..."
              className="w-full px-4 py-3 rounded-md bg-white/5 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C29307]"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#C29307] font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 text-white"
          >
            Send Message
          </button>

          {status && (
            <p className="text-center text-sm text-gray-700 mt-4">{status}</p>
          )}
        </form>
      </div>
    </section>
  );
}

export default Contact;
