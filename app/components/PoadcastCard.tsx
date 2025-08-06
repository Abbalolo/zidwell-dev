'use client';

import { ArrowRight } from 'lucide-react';
import { PodcastEpisode } from '../context/userData';


export default function PodcastCard({ episode }: { episode: PodcastEpisode }) {
  if (!episode) return null;

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition-all duration-300 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {episode.title}
      </h3>
      <p className="text-gray-600 text-sm mb-2">
        Creator: <span className="font-medium">{episode.creator}</span>
      </p>
      <p className="text-gray-500 text-sm mb-2">
        {episode.pubDate}
      </p>

      {episode.tags?.length && episode.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {episode.tags.map((tag) => (
            <span
              key={tag}
              className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <a
        href={episode.link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 font-medium inline-flex items-center hover:underline"
      >
        Read Now <ArrowRight className="ml-1 w-4 h-4" />
      </a>
    </div>
  );
}
