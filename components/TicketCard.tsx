"use client"

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import Spinner from "./Spinner";
import { CalendarDays, MapPin, Clock, User, ArrowRight, Ticket } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function TicketCard({ ticketId }: { ticketId: Id<"tickets"> }) {
    const ticket = useQuery(api.tickets.getTicketWithDetails, { ticketId });

    if (!ticket || !ticket.event) return <Spinner />;

    const isPastEvent = new Date(ticket.event.eventDate).getTime() < Date.now();

    const status = ticket.event.is_cancelled
        ? "cancelled"
        : ticket.status === "refunded"
            ? "refunded"
            : isPastEvent
                ? "used"
                : "confirmed";

    const statusConfig = {
        confirmed: {
            status: "Confirmed",
            bg: "bg-gradient-to-br from-emerald-50 to-green-50",
            text: "text-emerald-700",
            border: "border-emerald-200",
            badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
            dot: "bg-emerald-500",
            glow: "shadow-emerald-100",
        },
        valid: {
            status: "Valid",
            bg: "bg-gradient-to-br from-emerald-50 to-green-50",
            text: "text-emerald-700",
            border: "border-emerald-200",
            badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
            dot: "bg-emerald-500",
            glow: "shadow-emerald-100",
        },
        used: {
            status: "Used",
            bg: "bg-gradient-to-br from-slate-50 to-gray-50",
            text: "text-slate-600",
            border: "border-slate-200",
            badge: "bg-slate-100 text-slate-700 border-slate-200",
            dot: "bg-slate-400",
            glow: "shadow-slate-100",
        },
        refunded: {
            status: "Refunded",
            bg: "bg-gradient-to-br from-orange-50 to-red-50",
            text: "text-orange-700",
            border: "border-orange-200",
            badge: "bg-orange-100 text-orange-800 border-orange-200",
            dot: "bg-orange-500",
            glow: "shadow-orange-100",
        },
        cancelled: {
            status: "Cancelled",
            bg: "bg-gradient-to-br from-red-50 to-rose-50",
            text: "text-red-700",
            border: "border-red-200",
            badge: "bg-red-100 text-red-800 border-red-200",
            dot: "bg-red-500",
            glow: "shadow-red-100",
        },
    }[status];

    return (
        <div className={`group relative overflow-hidden border-2 ${statusConfig.border} ${statusConfig.bg} rounded-2xl p-6 w-full max-w-md mx-auto shadow-lg ${statusConfig.glow} hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1`}>
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Status badge */}
            <div className="absolute top-4 right-4">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${statusConfig.badge} text-xs font-semibold backdrop-blur-sm`}>
                    <div className={`w-2 h-2 rounded-full ${statusConfig.dot} animate-pulse`} />
                    {statusConfig.status}
                </div>
            </div>

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <Ticket className="w-5 h-5 text-indigo-600" />
                    <h2 className="font-bold text-lg text-gray-900 truncate">
                        Event Ticket
                    </h2>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <User className="w-4 h-4" />
                    <span>ID: {ticket.userId}</span>
                </div>
            </div>

            {/* Event Details */}
            <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/60 rounded-lg">
                        <CalendarDays className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">
                            {format(new Date(ticket.event.eventDate), "EEEE, MMMM do")}
                        </p>
                        <p className="text-xs text-gray-500">
                            {format(new Date(ticket.event.eventDate), "yyyy 'at' h:mm a")}
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/60 rounded-lg">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900 leading-tight">
                            {ticket.event.location}
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/60 rounded-lg">
                        <Clock className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">
                            Purchased
                        </p>
                        <p className="text-xs text-gray-500">
                            {format(new Date(ticket._creationTime), "dd/MM/yyyy 'at' h:mm a")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Price */}
            <div className="mb-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Total Paid</span>
                        <span className="text-2xl font-bold text-indigo-600">
                            £{ticket.event.price.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <Link
                href={`/tickets/${ticket._id}`}
                className="group/btn flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95"
            >
                <span>View Full Ticket</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
            </Link>

            {/* Decorative corner accent */}
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-indigo-100/30 to-transparent rounded-tl-full" />
        </div>
    );
}