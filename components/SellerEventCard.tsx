import { Doc } from '@/convex/_generated/dataModel'
import { Metrics } from '@/convex/events'
import { useStorageUrl } from '@/lib/utils'
import React from 'react'

function SellerEventCard({ event }: {
    event: Doc<"events"> & {
        metrics: Metrics
    }
}) {

    const imageUrl = useStorageUrl(event.imageStorageId)
    const isPastEvent = event.eventDate < Date.now()

    return (
        <div>SellerEventCard</div>
    )
}

export default SellerEventCard