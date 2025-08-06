"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { useUserContextData } from "../context/userData";
import PodcastCard from "./PoadcastCard";

export default function PodcastSection() {
  const { episodes, loading } = useUserContextData();

  if (loading) return <p className="text-center">Loading...</p>;

  if (!episodes || episodes.length === 0)
    return <p className="text-center">No podcast episodes found.</p>;

  // Show only the latest 3 episodes
  const featuredEpisodes = episodes?.slice(0, 3);

  if (!featuredEpisodes) return null;

  return (
    <section data-aos="fade-up" id="podcast" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Zidwell Academy
          </h2>
          <p className="text-lg text-gray-600">
            Learn about finance from our financial experts that write easy to
            understand articles to guide you to become financially free forever.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {featuredEpisodes.map((episode) => (
            <PodcastCard key={episode.id} episode={episode} />
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button
            size="lg"
            className="bg-[#C29307] text-white hover:bg-[#a87e06]"
            asChild
          >
            <a href="/podcasts">
              View All Episodes <ArrowRight className="ml-2 w-5 h-5" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
