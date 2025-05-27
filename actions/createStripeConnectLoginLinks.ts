"use server"

import { stripe } from "@/lib/stripe"

export async function createStripeConnectLoginLinks(stripeAccountId:string) {
    if(!stripeAccountId){
        throw new Error("No stripe account ID provided")
    }

    try {
        const loginLink = await stripe.accounts.createLoginLink(stripeAccountId)
        return loginLink.url
    } catch (error) {
        console.log("Error creating stripe connect login links", error)
        throw new Error("Failed to create stripe connect login link")
    }
}