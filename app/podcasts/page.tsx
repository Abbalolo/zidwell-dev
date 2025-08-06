'use client';

import { useState } from 'react';
import PodcastCard from '../components/PoadcastCard'; // Ensure correct import path
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious
} from '../components/ui/pagination';
import { useUserContextData } from '../context/userData';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PAGE_SIZE = 6;

export default function PodcastsPage() {
  const { episodes, loading } = useUserContextData();
  const [currentPage, setCurrentPage] = useState(1);

  if (loading) return <p className="text-center py-10">Loading...</p>;
  if (!episodes || episodes.length === 0) {
    return (
      <div className="min-h-screen py-16 px-6 md:px-10 bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600 text-lg">No podcast episodes found.</p>
      </div>
    );
  }

  const pageCount = Math.ceil(episodes.length / PAGE_SIZE);

  const paginatedEpisodes = episodes.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const next = () => {
    if (currentPage < pageCount) setCurrentPage((prev) => prev + 1);
  };

  const prev = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  return (
    <>
    <Header/>
    <div className="min-h-screen py-16 px-6 md:px-10 mt-10">
      <div className="max-w-5xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900">All Podcast Episodes</h1>
        <p className="text-gray-600 mt-2">Explore all our episodes and articles</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {paginatedEpisodes.map((ep, index) => (
          <PodcastCard key={index} episode={ep} />
        ))}
      </div>

      {pageCount > 1 && (
        <div className="mt-10 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={prev}
                  className="cursor-pointer"
                />
              </PaginationItem>
              <PaginationItem className="text-sm px-4 py-1 text-gray-700">
                Page {currentPage} of {pageCount}
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={next}
                  className="cursor-pointer"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
    <Footer/>
    </>
  );
}
