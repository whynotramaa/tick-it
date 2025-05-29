"use client"

import EventCard from '@/components/EventCard'
import Spinner from '@/components/Spinner'
import { api } from '@/convex/_generated/api'
import { useQuery } from 'convex/react'
import { useSearchParams } from 'next/navigation'
import React from 'react'

function SearchPage() {

  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const searchResults = useQuery(api.events.search, {
    searchTerm: query
  })
  if (!searchResults) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const upcomingEvents = searchResults
    .filter((event) => event.eventDate > Date.now())
    .sort((a, b) => a.eventDate - b.eventDate);

  const pastEvents = searchResults
    .filter((event) => event.eventDate <= Date.now())
    .sort((a, b) => b.eventDate - a.eventDate); // Note the reversed sort for past events

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <h2 className="text-2xl font-semibold text-gray-800">
        Search results for: <span className="text-blue-600">{query}</span>
      </h2>

      {searchResults.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-24">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-700">No events found</h3>
          <p className="text-gray-500 mt-2">
            Try searching for something else or check your spelling.
          </p>
        </div>
      ) : (
        <>
          {upcomingEvents.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                Upcoming Events
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => (
                  <EventCard key={event._id} eventId={event._id} />
                ))}
              </div>
            </div>
          )}

          {pastEvents.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mt-8 mb-4 text-gray-800">
                Past Events
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastEvents.map((event) => (
                  <EventCard key={event._id} eventId={event._id} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

}

export default SearchPage