import { v } from "convex/values";
import { query } from "./_generated/server";

export const get = query({
    args:{},
    handler: async(ctx) => {
        return await ctx.db
        .query("events")
        .filter((q)=> q.eq(q.field("is_cancelled"), undefined))
        .collect()
    }
})

export const getById = query({
    args:{eventId : v.id("events")},
    handler: async(ctx, {eventId}) => {
        return await ctx.db.get(eventId)
    }
})