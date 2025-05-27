import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { DURATIONS, TICKET_STATUS, WAITING_LIST_STATUS } from "./constant";
import { internal } from "./_generated/api";

export const getQueuePosition = query({
    args: {
        eventId: v.id("events"),
        userId: v.string(),
    },
    handler: async (ctx, { eventId, userId }) => {
        // get entry speicific for users and event combination
        const entry = await ctx.db.query("waitingList").withIndex("by_user_event",
            (q) => q.eq("userId", userId).eq("eventId", eventId))
            .filter((q) => q.neq(q.field("status"), WAITING_LIST_STATUS.EXPIRED)).first()
        if (!entry) return null;


        // get total number of people ahead of the user
        const peopleAhead = await ctx.db
            .query("waitingList")
            .withIndex("by_event_status", (q) => q.eq("eventId", eventId))
            .filter((q) =>
                q.and(
                    q.lt(q.field("_creationTime"), entry?._creationTime),
                    // only getting the entries that are offered or waiting
                    q.or(
                        q.eq(q.field("status"), WAITING_LIST_STATUS.WAITING),
                        q.eq(q.field("status"), WAITING_LIST_STATUS.OFFERED)
                    )
                )
            )
            .collect()
            .then((entries) => entries.length)



        if (!entry) return null;

        return {
            ...entry,
            position: peopleAhead + 1, //+1 coz if there is one people ahead that means i am at number 2 in queue 
        }
    }
})


export const releaseTicket = mutation({
    args: {
        eventId: v.id("events"),
        waitingListId: v.id("waitingList"),
    },
    handler: async (ctx, { eventId, waitingListId }) => {
        const entry = await ctx.db.get(waitingListId);

        if (!entry || entry.status !== WAITING_LIST_STATUS.OFFERED) {
            throw new Error("No valid ticket offer found")
        }


        await ctx.db.patch(waitingListId, {
            status: WAITING_LIST_STATUS.EXPIRED
        })

        // process queue to offer ticket to next person
        await ctx.runMutation(internal.waitingList.processQueue, { eventId });
    }
})

export const expireOffer = internalMutation({
    args: {
        waitingListId: v.id("waitingList"),
        eventId: v.id("events")
    },
    handler: async (ctx, { waitingListId, eventId }) => {
        const offer = await ctx.db.get(waitingListId)
        if (!offer || offer.status !== WAITING_LIST_STATUS.OFFERED) return

        await ctx.db.patch(waitingListId, {
            status: WAITING_LIST_STATUS.EXPIRED
        })

        await ctx.runMutation(internal.waitingList.processQueue, { eventId });
        // beccause when we expire any offer we must re process the queue 

    }
})


// mutation to process waiting list queue and offer tickets to next eligiible users
// checks current availability considering purchased tickets and active offers

export const processQueue = internalMutation({
    args: {
        eventId: v.id("events"),
    },
    handler: async (ctx, { eventId }) => {
        const event = await ctx.db.get(eventId)
        if (!event) throw new Error("Event not found")

        // get total number of tickets purchased for the event 
        const { availableSpots } = await ctx.db
            .query("events")
            .filter((q) => q.eq(q.field("_id"), eventId))
            .first()
            .then(async (event) => {
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

                const now = Date.now()
                const activeOffers = await ctx.db
                    .query("waitingList")
                    .withIndex("by_event_status", (q) =>
                        q.eq("eventId", eventId).eq("status", WAITING_LIST_STATUS.OFFERED)
                    )
                    .collect()
                    .then(
                        (entries) =>
                            entries.filter((e) => (e.offerExpiresAt ?? 0) > now).length
                    )

                return {
                    availableSpots: event.totalTickets - (purchasedCount + activeOffers)
                }
            })
        if (availableSpots <= 0) return


        // get next users in line
        const waitingUsers = await ctx.db
            .query("waitingList")
            .withIndex("by_event_status", (q) => q.eq("eventId", eventId).eq("status", WAITING_LIST_STATUS.WAITING))
            .order("asc")
            .take(availableSpots) //if there are 3 smoty, all goes at once not just one by one

        // create time limmited offers for selected users
        const now = Date.now();
        for (const user of waitingUsers) {
            // Update the waiting list entry to OFFERED status
            await ctx.db.patch(user._id, {
                status: WAITING_LIST_STATUS.OFFERED,
                offerExpiresAt: now + DURATIONS.TICKET_OFFER,
            });

            // Schedule expiration job for this offer
            await ctx.scheduler.runAfter(
                DURATIONS.TICKET_OFFER,
                internal.waitingList.expireOffer,
                {
                    waitingListId: user._id,
                    eventId, // Assuming eventId is defined in the outer scope
                }
            );
        }
    }
})