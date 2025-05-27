"use client"

import EventCard from "@/components/EventCard"
import JoinQueue from "@/components/JoinQueue"
import Spinner from "@/components/Spinner"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useStorageUrl } from "@/lib/utils"
import { SignInButton, useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { CalendarDays, MapPin, Ticket, Users2 } from "lucide-react"
import Image from "next/image"
import { useParams } from "next/navigation"


function EventPage() {
    const { user } = useUser()
    const params = useParams()
    const idString = typeof params?.id === "string" ? params.id : undefined;
    const eventId = idString as Id<"events"> | undefined;

    const event = useQuery(
        api.events.getById,
        eventId ? { eventId } : "skip"
    );

    const availability = useQuery(
        api.events.getEventAvailability,
        eventId ? { eventId } : "skip"
    );

    const imageUrl = useStorageUrl(event?.imageStorageId);

    if (!event || !availability) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner />
            </div>
        )
    }

    if (!params?.id) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-600 font-semibold text-lg">Invalid event URL.</p>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-50">
            {/* event details */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* event image */}
                    {imageUrl && (
                        <div className="relative w-full aspect-[21/9]">
                            <Image
                                src={imageUrl}
                                alt={event.name}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    )}
                    {/* event details in depth */}
                    <div className="p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* left column - event details */}
                            <div className="space-y-8">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                        {event.name}
                                    </h1>
                                    <p className="text-md text-gray-600">
                                        {event.description}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <div className="flex items-center text-gray-600 mb-1">
                                            <CalendarDays className="w-4 h-4 mr-2 text-blue-600" />
                                            <span className="text-md  font-medium text-gray-500">Date</span>
                                        </div>
                                        <p className="text-gray-900 text-sm">
                                            {new Date(event.eventDate).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <div className="flex items-center text-gray-600 mb-1">
                                            <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                                            <span className="text-md font-medium text-gray-500">Location</span>
                                        </div>
                                        <p className="text-gray-900 text-sm">{event.location}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <div className="flex items-center text-gray-600 mb-1">
                                            <Ticket className="w-4 h-4 mr-2 text-blue-600" />
                                            <span className="text-md font-medium text-gray-500">Price</span>
                                        </div>
                                        <p className="text-gray-900 text-sm">₹ {event.price.toFixed(2)}</p>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <div className="flex items-center text-gray-600 mb-1">
                                            <Users2 className="w-4 h-4 mr-2 text-blue-600" />
                                            <span className="text-md font-medium text-gray-500">Availability</span>
                                        </div>
                                        <p className="text-gray-900 text-sm">
                                            {availability.totalTickets - availability.purchasedCount}
                                            {" "}
                                            / {availability.totalTickets} left
                                        </p>
                                    </div>

                                </div>

                                {/* additional information */}

                                <div className="bg-blue-100 p-4 rounded-lg border border-blue-200 mt-4">
                                    <p className="text-blue-900 font-semibold mb-2">Additional Information:</p>
                                    <ul className="list-disc list-inside text-blue-800 text-sm space-y-1">
                                        <li>Non-refundable tickets.</li>
                                        <li>Age 18+ only.</li>
                                        <li>Please arrive 30 minutes before the event starts.</li>
                                        <li>For any queries, please contact the organizers.</li>
                                    </ul>
                                </div>



                            </div>

                            {/* right column - ticket purchase */}

                            <div>
                                <div className="sticky top-8 space-y-4">
                                    <EventCard eventId={params.id as Id<"events">} />
                                    {user ? (
                                        <JoinQueue
                                            eventId={params.id as Id<"events"> }
                                            userId={user.id}
                                        />
                                    ) : (
                                        <SignInButton>
                                            <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg">
                                                Sign in to buy tickets
                                            </Button>
                                        </SignInButton>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
            
        </div>
    )
}

export default EventPage