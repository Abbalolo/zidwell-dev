"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

const podcastEpisodes = [
  {
    id: 1,
    title: "How Small Businesses Can Leverage AI in 2025",
    guest: "Sarah Adedeji",
    date: "July 7, 2025",
    duration: "28 mins",
    episodeUrl: "/podcast/episode-17",
  },
  {
    id: 2,
    title: "Scaling Your Startup Without Burning Out",
    guest: "Michael Adebayo",
    date: "July 1, 2025",
    duration: "35 mins",
    episodeUrl: "/podcast/episode-16",
  },
  {
    id: 3,
    title: "The Future of Payments in Africa",
    guest: "Ada Nwachukwu",
    date: "June 24, 2025",
    duration: "30 mins",
    episodeUrl: "/podcast/episode-15",
  },
  {
    id: 4,
    title: "Building Customer Trust in the Digital Age",
    guest: "David Okoye",
    date: "June 17, 2025",
    duration: "33 mins",
    episodeUrl: "/podcast/episode-14",
  },
  {
    id: 5,
    title: "From Idea to MVP: Launch Fast, Learn Faster",
    guest: "Halima Yusuf",
    date: "June 10, 2025",
    duration: "25 mins",
    episodeUrl: "/podcast/episode-13",
  },
];

const Podcast = () => {
  return (
    <section id="podcast" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Zidwell Podcast
          </h2>
          <p className="text-lg text-gray-600">
            Insightful conversations with entrepreneurs, developers, and
            business leaders shaping the future.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {podcastEpisodes.map((episode) => (
            <div
              key={episode.id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition-all duration-300 p-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {episode.title}
              </h3>
              <p className="text-gray-600 text-sm mb-2">
                Guest: <span className="font-medium">{episode.guest}</span>
              </p>
              <p className="text-gray-500 text-sm mb-4">
                {episode.date} • {episode.duration}
              </p>
              <a
                href={episode.episodeUrl}
                className="text-blue-600 font-medium inline-flex items-center hover:underline"
              >
                Listen Now <ArrowRight className="ml-1 w-4 h-4" />
              </a>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button
            size="lg"
            className="bg-[#C29307] text-white hover:bg-[#a87e06]"
          >
            View All Episodes <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Podcast;
