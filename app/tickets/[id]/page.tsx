"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { redirect, useParams } from "next/navigation";
import { useEffect } from "react";
import QRCode from "react-qr-code";
import Image from "next/image";
import Link from "next/link";
import {
    ArrowLeft,
    Calendar,
    Clock,
    Download,
    MapPin,
    Share2,
    Ticket,
    User,
    Users,
} from "lucide-react";
import { useStorageUrl } from "@/lib/utils";

function MyTicket() {
    const params = useParams();
    const { user } = useUser();
    const ticket = useQuery(api.tickets.getTicketWithDetails, {
        ticketId: params.id as Id<"tickets">,
    });

    const imageUrl = useStorageUrl(ticket?.event?.imageStorageId);

    useEffect(() => {
        if (!user) redirect("/");
        if (ticket && ticket.userId !== user.id) redirect("/tickets");
        if (ticket && !ticket.event) redirect("/tickets");
    }, [user, ticket]);

    if (!ticket || !ticket.event) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    const formatDate = (timestamp: number) =>
        new Date(timestamp).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });

    const formatTime = (timestamp: number) =>
        new Date(timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });

    const isPastEvent = new Date(ticket.event.eventDate) < new Date();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Back Nav */}
            <div className="bg-white border-b">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <Link
                        href="/tickets"
                        className="inline-flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" /> Back to My Tickets
                    </Link>
                </div>
            </div>

            {/* Ticket Preview */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-6">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="bg-white rounded-2xl shadow p-6 flex justify-between items-center border-l-4 border-blue-500">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Ticket className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {ticket.event.name}
                                </h2>
                                <div className="text-gray-600 text-sm mt-1 flex gap-4">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" /> {formatDate(ticket.event.eventDate)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" /> {formatTime(ticket.event.eventDate)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span
                                className={`text-sm px-3 py-1 rounded-full font-medium ${isPastEvent
                                        ? "bg-gray-100 text-gray-600"
                                        : "bg-green-100 text-green-700"
                                    }`}
                            >
                                {isPastEvent ? "Past Event" : "Upcoming Event"}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                                Ticket #{ticket._id.slice(-8)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow overflow-hidden">
                        {imageUrl && (
                            <div className="relative h-64 w-full">
                                <Image
                                    src={imageUrl}
                                    alt={ticket.event.name}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-4 left-4 text-white">
                                    <h1 className="text-2xl font-bold">{ticket.event.name}</h1>
                                </div>
                            </div>
                        )}
                        <div className="p-6">
                            <div className="flex gap-4 mb-6">
                                <button
                                    onClick={() => navigator.share?.({
                                        title: `Ticket for ${ticket.event?.name}`,
                                        url: window.location.href,
                                    })}
                                    className="flex items-center gap-2 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
                                >
                                    <Share2 className="w-4 h-4" /> Share
                                </button>
                                <button
                                    onClick={() => console.log("Download ticket")}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <Download className="w-4 h-4" /> Download
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex gap-3">
                                        <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                                        <div>
                                            <h3 className="font-medium">Date & Time</h3>
                                            <p>{formatDate(ticket.event.eventDate)}</p>
                                            <p>{formatTime(ticket.event.eventDate)}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                                        <div>
                                            <h3 className="font-medium">Location</h3>
                                            <p>{ticket.event.location || "Location TBA"}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex gap-3">
                                        <User className="w-5 h-5 text-gray-400 mt-1" />
                                        <div>
                                            <h3 className="font-medium">Attendee</h3>
                                            <p>{user?.fullName || user?.firstName || "Guest"}</p>
                                            <p className="text-sm text-gray-500">{user?.emailAddresses?.[0]?.emailAddress}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Ticket className="w-5 h-5 text-gray-400 mt-1" />
                                        <div>
                                            <h3 className="font-medium">Ticket ID</h3>
                                            <p>#{ticket._id.slice(-8)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {ticket.event.description && (
                        <div className="bg-white rounded-2xl shadow p-6">
                            <h2 className="text-lg font-semibold mb-2">About the Event</h2>
                            <p className="text-gray-700 whitespace-pre-line">
                                {ticket.event.description}
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Side */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow p-6 text-center">
                        <h2 className="text-lg font-semibold mb-4">Entry QR Code</h2>
                        <div className="inline-block p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                            <QRCode
                                value={JSON.stringify({
                                    ticketId: ticket._id,
                                    userId: user?.id,
                                    eventId: ticket.event._id,
                                })}
                                size={160}
                            />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            Show this QR code at entry
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow p-6">
                        <h3 className="text-lg font-semibold mb-3">Quick Info</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Event</span>
                                <span className="font-medium text-right max-w-[150px]">
                                    {ticket.event.name}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Date</span>
                                <span className="font-medium">{formatDate(ticket.event.eventDate)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Time</span>
                                <span className="font-medium">{formatTime(ticket.event.eventDate)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Ticket ID</span>
                                <span className="font-mono text-sm">#{ticket._id.slice(-8)}</span>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`p-6 rounded-2xl border ${isPastEvent ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-200"
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Users className={`w-5 h-5 ${isPastEvent ? "text-gray-600" : "text-blue-600"}`} />
                            <h4 className={`font-semibold ${isPastEvent ? "text-gray-800" : "text-blue-800"}`}>
                                {isPastEvent ? "Event Completed" : "Event Instructions"}
                            </h4>
                        </div>
                        <ul className={`text-sm space-y-1 ${isPastEvent ? "text-gray-600" : "text-blue-700"}`}>
                            {isPastEvent ? (
                                <>
                                    <li>• This event has ended</li>
                                    <li>• Keep this ticket for records</li>
                                    <li>• Thank you for attending!</li>
                                </>
                            ) : (
                                <>
                                    <li>• Arrive 15 minutes early</li>
                                    <li>• Have your QR code ready</li>
                                    <li>• Bring a valid ID</li>
                                    <li>• Check for updates</li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MyTicket;
