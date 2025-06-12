import { api, internal } from '@/convex/_generated/api';
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { DURATIONS, TICKET_STATUS, WAITING_LIST_STATUS } from "./constant";


export type Metrics = {
    soldTickets: number;
    refundedTickets: number;
    cancelledTickets: number;
    revenue: number;
}
export const cancelEvent = mutation({
    args: { eventId: v.id("events") },
    handler: async (ctx, { eventId }) => {
        const event = await ctx.db.get(eventId);
        if (!event) throw new Error("Event not found");

        // Get all valid tickets for this event
        const tickets = await ctx.db
            .query("tickets")
            .withIndex("by_event", (q) => q.eq("eventId", eventId))
            .filter((q) =>
                q.or(q.eq(q.field("status"), "valid"), q.eq(q.field("status"), "used"))
            )
            .collect();

        if (tickets.length > 0) {
            throw new Error(
                "Cannot cancel event with active tickets. Please refund all tickets first."
            );
        }

        // Mark event as cancelled
        await ctx.db.patch(eventId, {
            is_cancelled: true,
        });

        // Delete any waiting list entries
        const waitingListEntries = await ctx.db
            .query("waitingList")
            .withIndex("by_event_status", (q) => q.eq("eventId", eventId))
            .collect();

        for (const entry of waitingListEntries) {
            await ctx.db.delete(entry._id);
        }

        return { success: true };
    },
});

export const getSellerEvents = query({
    args: { userId: v.string() },
    handler: async (ctx, { userId }) => {
        const events = await ctx.db
            .query("events")
            .filter((q) => q.eq(q.field("userId"), userId))
            .collect();

        // For each event, get ticket sales data
        const eventsWithMetrics = await Promise.all(
            events.map(async (event) => {
                const tickets = await ctx.db
                    .query("tickets")
                    .withIndex("by_event", (q) => q.eq("eventId", event._id))
                    .collect();

                const validTickets = tickets.filter(
                    (t) => t.status === "valid" || t.status === "used"
                );
                const refundedTickets = tickets.filter((t) => t.status === "refunded");
                const cancelledTickets = tickets.filter(
                    (t) => t.status === "cancelled"
                );

                const metrics: Metrics = {
                    soldTickets: validTickets.length,
                    refundedTickets: refundedTickets.length,
                    cancelledTickets: cancelledTickets.length,
                    revenue: validTickets.length * event.price,
                };

                return {
                    ...event,
                    metrics,
                };
            })
        );
        return eventsWithMetrics
    },
});

export const search = query({
    args: { searchTerm: v.string() },
    handler: async (ctx, { searchTerm }) => {
        const events = await ctx.db
            .query("events")
            .filter((q) => q.eq(q.field("is_cancelled"), undefined))
            .collect();

        return events.filter((event) => {
            const searchTermLower = searchTerm.toLowerCase();
            return (
                event.name.toLowerCase().includes(searchTermLower) ||
                event.description.toLowerCase().includes(searchTermLower) ||
                event.location.toLowerCase().includes(searchTermLower)
            );
        });
    },
})

export const purchaseTicket = mutation({
    args: {
        eventId: v.id("events"),
        userId: v.string(),
        waitingListId: v.id("waitingList"),
        paymentInfo: v.object({
            paymentIntentId: v.string(),
            amount: v.number()
        })
    },

    handler: async (ctx, { eventId, userId, waitingListId, paymentInfo }) => {
        console.log("Starting purchase ticket handler", {
            eventId, userId, waitingListId
        })

        // verify waiting list entry
        const waitingListEntry = await ctx.db.get(waitingListId)
        console.log("Waiting list entry", waitingListEntry)

        if (!waitingListEntry) {
            console.log("Waiting list entry not found ")
            throw new Error("Waiting list entry not found")
        }

        if (waitingListEntry.status !== WAITING_LIST_STATUS.OFFERED) {
            console.log("Invalid waiting list status", {
                status: waitingListEntry.status,
            })
            throw new Error(
                "Invalid waiting list status  -  ticket might have expired"
            )
        }

        if (waitingListEntry.userId !== userId) {
            console.log("User Id mismatched", {
                waitingListUserId: waitingListEntry.userId,
                requestUserId: userId
            })
            throw new Error("Waiting list entry does not belong to this user")
        }

        // verifying for the event 
        const event = await ctx.db.get(eventId)
        console.log("Event Details", event)

        if (!event) {
            console.log("Event not found", { eventId })
            throw new Error("Event not found")
        }

        if (event.is_cancelled) {
            console.log("Attemped purchase of cancelled event", { eventId })
            throw new Error("Event is no longer active")
        }

        try {
            console.log("Creating ticket with payment info", paymentInfo);
            // Create ticket with payment info
            await ctx.db.insert("tickets", {
                eventId,
                userId: waitingListEntry.userId,
                purchasedAt: Date.now(),
                status: TICKET_STATUS.CONFIRMED,
                paymentIntentId: paymentInfo.paymentIntentId,
                amount: paymentInfo.amount,
            });

            console.log("Updating waiting list status to purchased");
            await ctx.db.patch(waitingListId, {
                status: WAITING_LIST_STATUS.PURCHASED,
            });

            console.log("Processing queue for next person");
            // Process queue for next person
            await ctx.runMutation(internal.waitingList.processQueue, { eventId });

            console.log("Purchase ticket completed successfully");
        } catch (error) {
            console.log("Failed to complete purchase ticket", error)
            throw new Error("Failed to complete purchase ticket")
        }

    }
})

export const getUserTickets = query({
    args: { userId: v.string() },
    handler: async (ctx, { userId }) => {
        const tickets = await ctx.db
            .query("tickets")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        const ticketsWithEvents = await Promise.all(
            tickets.map(async (ticket) => {
                const event = await ctx.db.get(ticket.eventId);
                return {
                    ...ticket,
                    event,
                };
            })
        );
        return ticketsWithEvents;
    },
});



export const checkAvailability = query({
    args: { eventId: v.id("events") },
    handler: async (ctx, { eventId }) => {
        const event = await ctx.db.get(eventId)

        if (!event) throw new Error("Event not found")

        const purchasedCount = await ctx.db
            .query("tickets")
            .withIndex("by_event", (q) => q.eq("eventId", eventId))
            .collect()
            .then(
                (tickets) =>
                    tickets.filter(
                        (t) =>
                            t.status === TICKET_STATUS.VALID ||
                            t.status === TICKET_STATUS.USED
                    ).length
            )

        const activeOffers = await ctx.db
            .query("waitingList")
            .withIndex("by_event_status", (q) =>
                q.eq("eventId", eventId).eq("status", WAITING_LIST_STATUS.OFFERED)
            )
            .collect()
            .then(
                (entries) => entries.filter((e) => (e.offerExpiresAt ?? 0) > Date.now()).length
            )

        const availableSpots = event.totalTickets - (purchasedCount + activeOffers)

        return {
            available: availableSpots > 0,
            availableSpots,
            totalTickets: event.totalTickets,
            purchasedCount,
            activeOffers
        }
    }
})

export const get = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("events")
            .filter((q) => q.eq(q.field("is_cancelled"), undefined))
            .collect()
    }
})

export const getById = query({
    args: { eventId: v.id("events") },
    handler: async (ctx, { eventId }) => {
        return await ctx.db.get(eventId)
    }
})

export const getEventAvailability = query({
    args: { eventId: v.id("events") },
    handler: async (ctx, { eventId }) => {
        const event = await ctx.db.get(eventId);
        if (!event) throw new Error("Events not found");

        // counting total tickets purchased
        const purchasedCount = await ctx.db.query("tickets").withIndex("by_event", (q) => q.eq("eventId", eventId)).collect().then(
            (tickets) =>
                tickets.filter(
                    (t) =>
                        t.status == TICKET_STATUS.VALID ||
                        t.status == TICKET_STATUS.USED
                ).length
        )

        // Count current valid offers
        const now = Date.now()
        const activeOffers = await ctx.db
            .query("waitingList")
            .withIndex("by_event_status", (q) =>
                q.eq("eventId", eventId).eq("status", WAITING_LIST_STATUS.OFFERED)
            )
            .collect()
            .then(
                (entries) => entries.filter((e) => (e.offerExpiresAt ?? 0) > now).length
            )

        const totalReserved = purchasedCount + activeOffers;

        return {
            isSoldOut: totalReserved >= event.totalTickets,
            totalTickets: event.totalTickets,
            purchasedCount,
            activeOffers,
            remainingTickets: Math.max(0, event.totalTickets - totalReserved),
        }


    }

})

export const create = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        location: v.string(),
        eventDate: v.number(), // Store as timestamp
        price: v.number(),
        totalTickets: v.number(),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const eventId = await ctx.db.insert("events", {
            name: args.name,
            description: args.description,
            location: args.location,
            eventDate: args.eventDate,
            price: args.price,
            totalTickets: args.totalTickets,
            userId: args.userId,
        });
        return eventId;
    },
});

export const updateEvent = mutation({
    args: {
        eventId: v.id("events"),
        name: v.string(),
        description: v.string(),
        location: v.string(),
        eventDate: v.number(),
        price: v.number(),
        totalTickets: v.number(),
    },
    handler: async (ctx, args) => {
        const { eventId, ...updates } = args;

        // Get current event to check tickets sold
        const event = await ctx.db.get(eventId);
        if (!event) throw new Error("Event not found");

        const soldTickets = await ctx.db
            .query("tickets")
            .withIndex("by_event", (q) => q.eq("eventId", eventId))
            .filter((q) =>
                q.or(q.eq(q.field("status"), "valid"), q.eq(q.field("status"), "used"))
            )
            .collect();

        // Ensure new total tickets is not less than sold tickets
        if (updates.totalTickets < soldTickets.length) {
            throw new Error(
                `Cannot reduce total tickets below ${soldTickets.length} (number of tickets already sold)`
            );
        }

        await ctx.db.patch(eventId, updates);
        return eventId;
    },
});

export const joinWaitingList = mutation({
    args: { eventId: v.id("events"), userId: v.string() },
    handler: async (ctx, { eventId, userId }): Promise<{
        success: boolean;
        status: string;
        message: string;
    }> => {
        // RATE LIMIT CHECK


        // firslt checking if user have any active in waiting list 
        const existingEntry = await ctx.db.query("waitingList")
            .withIndex("by_user_event", (q) => q.eq("userId", userId).eq("eventId", eventId))
            .filter((q) => q.neq(q.field("status"), WAITING_LIST_STATUS.EXPIRED)).first()

        if (existingEntry) {
            throw new Error("Calm down.. You are already in waiting list for this event")
        }
        const event = await ctx.db.get(eventId)

        if (!event) throw new Error("Event Not Found")

        const { available } = await ctx.runQuery(api.events.checkAvailability, { eventId })
        const now = Date.now()

        if (available) {
            const waitingListId = await ctx.db.insert("waitingList", {
                eventId,
                userId,
                status: WAITING_LIST_STATUS.OFFERED,
                offerExpiresAt: now + DURATIONS.TICKET_OFFER
            })

            await ctx.scheduler.runAfter(
                DURATIONS.TICKET_OFFER,
                internal.waitingList.expireOffer, {
                waitingListId, eventId
            }
            )
        }
        else {
            await ctx.db.insert("waitingList", {
                eventId, userId, status: WAITING_LIST_STATUS.WAITING, //mark it as waiting 
            })
        }

        return {
            success: true,
            status: available
                ? WAITING_LIST_STATUS.OFFERED
                : WAITING_LIST_STATUS.WAITING,

            message: available
                ? `Ticket offered - you have ${DURATIONS.TICKET_OFFER / (60 * 1000)} minutes to purchase`
                : "Added to waiting list - you'll be notified when a ticket becomes available",
        }



    }
})