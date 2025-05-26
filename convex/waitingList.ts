import { v } from "convex/values";
import { query } from "./_generated/server";
import { WAITING_LIST_STATUS } from "./constant";

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