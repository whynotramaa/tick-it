import { api, internal } from '@/convex/_generated/api';
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { DURATIONS, TICKET_STATUS, WAITING_LIST_STATUS } from "./constant";


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

export const joinWaitingList = mutation({
    args: { eventId: v.id("events"), userId: v.string() },
  handler: async (ctx, { eventId, userId }): Promise<{
    success: boolean;
    status: string;
    message: string;}> => {
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