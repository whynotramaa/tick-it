import { Doc } from "./_generated/dataModel";

export const DURATIONS = {
    TICKET_OFFER: 30 * 60 * 1000, //minimum stripe alloes for checkout expiry --> 30mins
} as const;

export const WAITING_LIST_STATUS: Record<string, Doc<"waitingList">["status"]> = {
    WAITING: "waiting",
    OFFERED: "offered",
    EXPIRED: "expired",
    PURCHASED: "purchased"
} as const

export const TICKET_STATUS: Record<string, Doc<"tickets">["status"]> = {
    CONFIRMED: "confirmed",
    VALID:"valid",
    USED:"used",
    REFUNDED:"refunded",
    CANCELLED:"cancelled",
} as const