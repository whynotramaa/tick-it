// "use client"

// import { api } from "@/convex/_generated/api"
// import { Id } from "@/convex/_generated/dataModel"
// import { useUser } from "@clerk/nextjs"
// import { useQuery } from "convex/react"
// import { redirect, useParams } from "next/navigation"
// import { useEffect } from "react"
// import QRCode from "react-qr-code"
// import Image from "next/image"
// import Link from "next/link"
// import {
//     Calendar,
//     Clock,
//     MapPin,
//     User,
//     Ticket,
//     Download,
//     Share2,
//     ArrowLeft,
//     Users
// } from "lucide-react"
// import { useStorageUrl } from "@/lib/utils"

// function MyTicket() {
//     const params = useParams()
//     const { user } = useUser()
//     const ticket = useQuery(api.tickets.getTicketWithDetails, {
//         ticketId: params.id as Id<"tickets">
//     })

    
//     const imageUrl = useStorageUrl(ticket?.event?.imageStorageId);


//     useEffect(() => {
//         if (!user) {
//             redirect("/");
//         }

//         if (ticket && ticket.userId !== user.id) {
//             redirect("/tickets");
//         }

//         if (ticket && !ticket.event) {
//             redirect("/tickets");
//         }
//     }, [user, ticket]);

//     if (!ticket || !ticket.event) {
//         return (
//             <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//                 <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
//             </div>
//         );
//     }

//     const formatDate = (timestamp) => {
//         return new Date(timestamp).toLocaleDateString('en-US', {
//             weekday: 'long',
//             year: 'numeric',
//             month: 'long',
//             day: 'numeric'
//         });
//     };

//     const formatTime = (timestamp) => {
//         return new Date(timestamp).toLocaleTimeString('en-US', {
//             hour: '2-digit',
//             minute: '2-digit'
//         });
//     };

//     const handleDownload = () => {
//         // Generate ticket download logic here
//         console.log('Download ticket');
//     };

//     const handleShare = () => {
//         // Share ticket logic here
//         if (navigator.share) {
//             navigator.share({
//                 title: `Ticket for ${ticket.event?.name}`,
//                 text: `Check out my ticket for ${ticket.event?.name}!`,
//                 url: window.location.href,
//             });
//         }
//     };

//     const eventDate = new Date(ticket.event?.eventDate);
//     const isPastEvent = eventDate <= new Date();

//     return (
//         <div className="min-h-screen bg-gray-50">
//             {/* Back Button */}
//             <div className="bg-white border-b border-gray-100">
//                 <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
//                     <Link
//                         href="/tickets"
//                         className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
//                     >
//                         <ArrowLeft className="w-4 h-4" />
//                         Back to My Tickets
//                     </Link>
//                 </div>
//             </div>

//             {/* Quick Ticket Info Card */}
//             <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-8">
//                 <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//                     <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
//                         <div className="flex items-center justify-between">
//                             <div className="flex items-center gap-4">
//                                 <div className="p-3 bg-blue-100 rounded-full">
//                                     <Ticket className="w-6 h-6 text-blue-600" />
//                                 </div>
//                                 <div>
//                                     <h2 className="text-xl font-bold text-gray-900">{ticket.event.name}</h2>
//                                     <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
//                                         <div className="flex items-center gap-1">
//                                             <Calendar className="w-4 h-4" />
//                                             {formatDate(ticket.event.eventDate)}
//                                         </div>
//                                         <div className="flex items-center gap-1">
//                                             <Clock className="w-4 h-4" />
//                                             {formatTime(ticket.event.eventDate)}
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                             <div className="text-right">
//                                 <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${isPastEvent
//                                         ? 'bg-gray-100 text-gray-600'
//                                         : 'bg-green-100 text-green-700'
//                                     }`}>
//                                     {isPastEvent ? 'Past Event' : 'Upcoming Event'}
//                                 </div>
//                                 <p className="text-sm text-gray-500 mt-1">Ticket #{ticket._id.slice(-8)}</p>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//                     {/* Left Column - Ticket Details */}
//                     <div className="lg:col-span-2 space-y-6">
//                         {/* Event Header with Image */}
//                         <div className="bg-white rounded-xl shadow-lg overflow-hidden">
//                             {ticket.event.imageStorageId && (
//                                 <div className="relative h-64">
//                                     <Image
//                                         src={ticket.event?.imageStorageId}
//                                         alt={ticket.event.name}
//                                         fill
//                                         className="object-cover"
//                                         priority
//                                     />
//                                     <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
//                                     <div className="absolute bottom-4 left-4 text-white">
//                                         <h1 className="text-2xl font-bold">{ticket.event.name}</h1>
//                                     </div>
//                                 </div>
//                             )}

//                             <div className="p-6">
//                                 {/* Action Buttons */}
//                                 <div className="flex gap-3 mb-6">
//                                     <button
//                                         onClick={handleShare}
//                                         className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
//                                     >
//                                         <Share2 className="w-4 h-4" />
//                                         Share
//                                     </button>
//                                     <button
//                                         onClick={handleDownload}
//                                         className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
//                                     >
//                                         <Download className="w-4 h-4" />
//                                         Download
//                                     </button>
//                                 </div>

//                                 {/* Event Information */}
//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                                     <div className="space-y-4">
//                                         <div className="flex items-start gap-3">
//                                             <Calendar className="w-5 h-5 text-gray-400 mt-1" />
//                                             <div>
//                                                 <h3 className="font-medium text-gray-900">Date & Time</h3>
//                                                 <p className="text-gray-600">{formatDate(ticket.event.eventDate)}</p>
//                                                 <p className="text-gray-600">{formatTime(ticket.event.eventDate)}</p>
//                                             </div>
//                                         </div>

//                                         <div className="flex items-start gap-3">
//                                             <MapPin className="w-5 h-5 text-gray-400 mt-1" />
//                                             <div>
//                                                 <h3 className="font-medium text-gray-900">Location</h3>
//                                                 <p className="text-gray-600">{ticket.event.location || 'Location TBA'}</p>
//                                             </div>
//                                         </div>
//                                     </div>

//                                     <div className="space-y-4">
//                                         <div className="flex items-start gap-3">
//                                             <User className="w-5 h-5 text-gray-400 mt-1" />
//                                             <div>
//                                                 <h3 className="font-medium text-gray-900">Attendee</h3>
//                                                 <p className="text-gray-600">{user?.fullName || user?.firstName || 'Guest'}</p>
//                                                 <p className="text-sm text-gray-500">{user?.emailAddresses?.[0]?.emailAddress}</p>
//                                             </div>
//                                         </div>

//                                         <div className="flex items-start gap-3">
//                                             <Ticket className="w-5 h-5 text-gray-400 mt-1" />
//                                             <div>
//                                                 <h3 className="font-medium text-gray-900">Ticket Details</h3>
//                                                 <p className="text-gray-600">ID: #{ticket._id.slice(-8)}</p>
//                                                 <p className="text-gray-600">Purchased: {formatDate(ticket._creationTime)}</p>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Event Description */}
//                         {ticket.event.description && (
//                             <div className="bg-white rounded-xl shadow-lg p-6">
//                                 <h2 className="text-xl font-semibold text-gray-900 mb-4">About this Event</h2>
//                                 <p className="text-gray-600 leading-relaxed whitespace-pre-line">{ticket.event.description}</p>
//                             </div>
//                         )}

//                         {/* Additional Event Details */}
//                         <div className="bg-white rounded-xl shadow-lg p-6">
//                             <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                 {ticket.event.price && (
//                                     <div>
//                                         <h4 className="font-medium text-gray-900">Price</h4>
//                                         <p className="text-gray-600">${ticket.event.price}</p>
//                                     </div>
//                                 )}
//                                 {ticket.event.totalTickets && (
//                                     <div>
//                                         <h4 className="font-medium text-gray-900">Total Tickets</h4>
//                                         <p className="text-gray-600">{ticket.event.totalTickets}</p>
//                                     </div>
//                                 )}
                                
//                                 <div>
//                                     <h4 className="font-medium text-gray-900">Event Type</h4>
//                                     <p className="text-gray-600">{isPastEvent ? 'Past Event' : 'Upcoming Event'}</p>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Right Column - QR Code and Quick Info */}
//                     <div className="space-y-6">
//                         {/* QR Code Card */}
//                         <div className="bg-white rounded-xl shadow-lg p-6 text-center">
//                             <h2 className="text-xl font-semibold text-gray-900 mb-4">Entry QR Code</h2>
//                             <div className="flex justify-center mb-4">
//                                 <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
//                                     <QRCode
//                                         value={JSON.stringify({
//                                             ticketId: ticket._id,
//                                             userId: user?.id,
//                                             eventId: ticket.event._id,
//                                             eventName: ticket.event.name,
//                                             attendeeName: user?.fullName || user?.firstName
//                                         })}
//                                         size={180}
//                                         level="M"
//                                         fgColor="#1f2937"
//                                         bgColor="#ffffff"
//                                     />
//                                 </div>
//                             </div>
//                             <p className="text-sm text-gray-500">
//                                 Show this QR code at the event entrance
//                             </p>
//                             {isPastEvent && (
//                                 <div className="mt-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
//                                     Event has ended
//                                 </div>
//                             )}
//                         </div>

//                         {/* Quick Info Card */}
//                         <div className="bg-white rounded-xl shadow-lg p-6">
//                             <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h2>
//                             <div className="space-y-3">
//                                 <div className="flex justify-between items-start">
//                                     <span className="text-gray-600">Event</span>
//                                     <span className="font-medium text-gray-900 text-right max-w-[150px]">{ticket.event.name}</span>
//                                 </div>
//                                 <div className="flex justify-between">
//                                     <span className="text-gray-600">Date</span>
//                                     <span className="font-medium text-gray-900">{formatDate(ticket.event.eventDate)}</span>
//                                 </div>
//                                 <div className="flex justify-between">
//                                     <span className="text-gray-600">Time</span>
//                                     <span className="font-medium text-gray-900">{formatTime(ticket.event.eventDate)}</span>
//                                 </div>
//                                 <div className="flex justify-between">
//                                     <span className="text-gray-600">Ticket ID</span>
//                                     <span className="font-mono text-sm text-gray-900">#{ticket._id.slice(-8)}</span>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Instructions Card */}
//                         <div className={`${isPastEvent ? 'bg-gray-50 border border-gray-200' : 'bg-blue-50 border border-blue-200'} rounded-xl p-6`}>
//                             <div className="flex items-center gap-2 mb-3">
//                                 <Users className={`w-5 h-5 ${isPastEvent ? 'text-gray-600' : 'text-blue-600'}`} />
//                                 <h3 className={`font-semibold ${isPastEvent ? 'text-gray-800' : 'text-blue-800'}`}>
//                                     {isPastEvent ? 'Event Completed' : 'Event Instructions'}
//                                 </h3>
//                             </div>
//                             <ul className={`text-sm space-y-1 ${isPastEvent ? 'text-gray-600' : 'text-blue-700'}`}>
//                                 {isPastEvent ? (
//                                     <>
//                                         <li>• This event has ended</li>
//                                         <li>• Keep this ticket for your records</li>
//                                         <li>• Thank you for attending!</li>
//                                     </>
//                                 ) : (
//                                     <>
//                                         <li>• Arrive 15 minutes before start time</li>
//                                         <li>• Have your QR code ready</li>
//                                         <li>• Bring a valid ID if required</li>
//                                         <li>• Check event updates regularly</li>
//                                     </>
//                                 )}
//                             </ul>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }

// export default MyTicket