"use client"

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel"
import { useMutation } from "convex/react";
import { XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function ReleaseTicket({
    eventId, waitingListId,
}: {
    eventId: Id<"events">;
    waitingListId: Id<"waitingList">
}) {

    const [isReleasing, setIsReleasing] = useState(false)
    const releaseTicket = useMutation(api.waitingList.releaseTicket)


const handleRelease = () => {
  toast.custom((t) => (
    <div
      className="text-yellow-800 bg-yellow-50 border border-yellow-300 p-4 rounded-md shadow-md min-w-[360px]"
      style={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)" }}
    >
      <p className="font-semibold text-base mb-1">⚠️ Release Ticket Offer?</p>
      <p className="text-sm text-yellow-900">
        This action cannot be undone. The ticket will be offered to the next person on the waiting list.
      </p>
      <div className="mt-4 flex justify-end space-x-3">
        <button
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1.5 rounded-md"
          onClick={async () => {
            toast.dismiss(t); // ✅ Dismiss the custom toast
            setIsReleasing(true);
            try {
              await releaseTicket({ eventId, waitingListId });
              toast.success("✅ Ticket offer released successfully!", {
                description: "The next person in the waiting list has been notified.",
              });
            } catch (error) {
              console.error("Error releasing the ticket", error);
              toast.error("❌ Failed to release ticket offer", {
                description: "Please try again or contact support.",
              });
            } finally {
              setIsReleasing(false);
            }
          }}
        >
          ✓ Yes, Release
        </button>
        <button
          className="border border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-1.5 rounded-md"
          onClick={() => toast.dismiss(t)} // Cancel and dismiss
        >
          ✕ Cancel
        </button>
      </div>
    </div>
  ));
};



    return (
        <button
            onClick={handleRelease}
            disabled={isReleasing}
            className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <XCircle className="w-4 h-4" />
            {isReleasing ? "Releasing ..." : "Release Ticket Offer"}

        </button>
    )
}

export default ReleaseTicket