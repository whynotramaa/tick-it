"use client"

import { Id } from '@/convex/_generated/dataModel'
import { useStorageUrl } from '@/lib/utils';
import { useQuery } from 'convex/react';
import React from 'react'
import Spinner from './Spinner';
import { api } from '@/convex/_generated/api';
import { CalendarDays, IdCard, MapPin, TicketIcon, User } from 'lucide-react';
import QRCode from "react-qr-code";


function Ticket({ ticketId }: { ticketId: Id<"tickets"> }) {
    const ticket = useQuery(api.tickets.getTicketWithDetails, { ticketId });
    const user = useQuery(api.users.getUserById, {
        userId: ticket?.userId ?? "",
    });
    const imageUrl = useStorageUrl(ticket?.event?.imageStorageId);

    if (!ticket || !ticket.event || !user) {
        return (<div className='flex justify-center items-center'><Spinner /></div>);
    }

    return (
        <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
                {/* Left Column - Event Details */}
                <div className="space-y-4">
                    <div className="flex items-center text-gray-600">
                        <CalendarDays 
                            className={`w-5 h-5 mr-3 ${ticket.event.is_cancelled ? "text-red-600" : "text-blue-600"}`}
                        />
                        <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-medium">
                                {new Date(ticket.event.eventDate).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center text-gray-600">
                        <MapPin 
                            className={`w-5 h-5 mr-3 ${ticket.event.is_cancelled ? "text-red-600" : "text-blue-600"}`}
                        />
                        <div>
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="font-medium">{ticket.event.location}</p>
                        </div>
                    </div>

                    <div className="flex items-center text-gray-600">
                        <TicketIcon 
                            className={`w-5 h-5 mr-3 ${ticket.event.is_cancelled ? "text-red-600" : "text-blue-600"}`}
                        />
                        <div>
                            <p className="text-sm text-gray-500">Ticket Price</p>
                            <p className="font-medium">${ticket.event.price.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="flex items-center text-gray-600">
                        <User 
                            className={`w-5 h-5 mr-3 ${ticket.event.is_cancelled ? "text-red-600" : "text-blue-600"}`}
                        />
                        <div>
                            <p className="text-sm text-gray-500">Ticket Holder</p>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center text-gray-600 break-all">
                        <IdCard 
                            className={`w-5 h-5 mr-3 ${ticket.event.is_cancelled ? "text-red-600" : "text-blue-600"}`}
                        />
                        <div>
                            <p className="text-sm text-gray-500">Ticket Holder ID</p>
                            <p className="font-medium">{user.userId}</p>
                        </div>
                    </div>
                </div>

                {/* Right Column - QR Code */}
                <div className="flex flex-col items-center justify-center border-l border-gray-200 pl-6">
                    <div 
                        className={`bg-gray-100 p-4 rounded-lg ${ticket.event.is_cancelled ? "opacity-50" : ""}`}
                    >
                        <QRCode 
                            value={ticket._id} 
                            size={128}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        />
                    </div>
                    <p className="mt-2 text-sm text-gray-500 break-all text-center max-w-[200px] md:max-w-full">
                        Ticket ID: {ticket._id}
                    </p>
                </div>
            </div>

            {/* Additional Information */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Important Information
                </h3>
                {ticket.event.is_cancelled ? (
                    <p className="text-sm text-red-600">
                        This event has been cancelled. A refund will be processed if it has not been already.
                    </p>
                ) : (
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Please arrive at least 30 minutes before the event</li>
                        <li>• Have your ticket QR code ready for scanning</li>
                        <li>• This ticket is non-transferable</li>
                    </ul>
                )}
            </div>
        </div>
    )
}

export default Ticket