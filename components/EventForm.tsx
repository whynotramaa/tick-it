"use client"

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useStorageUrl } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
// import Form from "next/form";
import { useRouter } from "next/navigation";
import { useState, useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import Image from "next/image";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";




const formSchema = z.object({
    name: z.string().min(1, "Event name is required"),
    description: z.string().min(1, "Description is required"),
    location: z.string().min(1, "Location is required"),
    eventDate: z
        .date()
        .min(
            new Date(new Date().setHours(0, 0, 0, 0)),
            "Event date must be in the future"
        ),
    price: z.number().min(0, "Price must be 0 or greater"),
    totalTickets: z.number().min(1, "Must have at least 1 ticket"),
});

type FormData = z.infer<typeof formSchema>

interface InitialEventData {
    _id: Id<"events">;
    name: string;
    description: string;
    location: string;
    eventDate: number;
    price: number;
    totalTickets: number;
    imageStorageId?: Id<"_storage">;
}

interface EventFormProps {
    mode: "create" | "edit"
    initialData?: InitialEventData
}

function EventForm({ mode, initialData }: EventFormProps) {

    const { user } = useUser();
    const createEvent = useMutation(api.events.create);
    const updateEvent = useMutation(api.events.updateEvent);
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    // const { toast } = useToast();
    const currentImageUrl = useStorageUrl(initialData?.imageStorageId);

    // Image upload
    const imageInput = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
    const updateEventImage = useMutation(api.storage.updateEventImage);
    const deleteImage = useMutation(api.storage.deleteImage);

    const [removedCurrentImage, setRemovedCurrentImage] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name ?? "",
            description: initialData?.description ?? "",
            location: initialData?.location ?? "",
            eventDate: initialData ? new Date(initialData.eventDate) : new Date(),
            price: initialData?.price ?? 20,
            totalTickets: initialData?.totalTickets ?? 1,
        },
    });

    async function onSubmit(values: FormData) {
        if (!user?.id) return;
        startTransition(async () => {
            try {
                let imageStorageId = null
                if (selectedImage) {
                    imageStorageId = await handleImageUpload(selectedImage)
                }
                // Handle image deletion/update in edit mode
                if (mode === "edit" && initialData?.imageStorageId) {
                    if (removedCurrentImage || selectedImage) {
                        // Delete old image from storage
                        await deleteImage({
                            storageId: initialData.imageStorageId,
                        });
                    }
                }

                if (mode === "create") {
                    const eventId = await createEvent({
                        ...values,
                        userId: user.id,
                        eventDate: values.eventDate.getTime(),
                    });

                    if (imageStorageId) {
                        await updateEventImage({
                            eventId,
                            storageId: imageStorageId as Id<"_storage">,
                        });
                    }

                    router.push(`/event/${eventId}`);
                } else {
                    if (!initialData) {
                        throw new Error("initial event data is required for updates")
                    }
                    // Update event details
                    await updateEvent({
                        eventId: initialData._id,
                        ...values,
                        eventDate: values.eventDate.getTime(),
                    });

                    // Update image - this will now handle both adding new image and removing existing image
                    if (imageStorageId || removedCurrentImage) {
                        await updateEventImage({
                            eventId: initialData._id,
                            // If we have a new image, use its ID, otherwise if we're removing the image, pass null
                            storageId: imageStorageId
                                ? (imageStorageId as Id<"_storage">)
                                : null,
                        });
                    }

                    toast("Event Updated", {
                        description: "Your event has been successfully updated"
                    })

                    router.push(`/event/${initialData._id}`)
                }

            } catch (error) {
                console.log("Failure in submitting form", error)
                toast("Uh Oh! Something went wrong", {
                    // variant: "destructive",
                    description: "There was a problem with your request"
                })

            }
        })
    }

    async function handleImageUpload(file: File): Promise<string | null> {
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();
            return storageId;
        } catch (error) {
            console.error("Failed to upload image:", error);
            return null;
        }
    }

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Form {...form} >
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-6">

                    {/* Event Name */}
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Event Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter event name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Description */}
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <textarea
                                        {...field}
                                        placeholder="Describe your event..."
                                        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Location */}
                    <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                    <Input placeholder="Venue or online link" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Event Date */}
                    <FormField
                        control={form.control}
                        name="eventDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Event Date</FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        className="w-full"
                                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            const parsed = new Date(value);
                                            if (!isNaN(parsed.getTime())) {
                                                field.onChange(parsed);
                                            } else {
                                                field.onChange(null); // or leave unchanged, based on your preference
                                            }
                                        }}
                                        onBlur={field.onBlur}
                                        name={field.name}
                                        ref={field.ref}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Price per Ticket */}
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Price Per Ticket (₹)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        {...field}
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />


                    {/* Total Tickets */}
                    <FormField
                        control={form.control}
                        name="totalTickets"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Total Tickets</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="Enter number of tickets"
                                        {...field}
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />

                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Image Upload */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Event Image
                        </label>

                        <div className="mt-1 flex items-center gap-4">
                            {imagePreview || (!removedCurrentImage && currentImageUrl) ? (
                                <div className="relative w-32 aspect-square bg-gray-100 rounded-lg">
                                    <Image
                                        src={imagePreview || currentImageUrl!}
                                        alt="Preview"
                                        fill
                                        className="object-contain rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedImage(null);
                                            setImagePreview(null);
                                            setRemovedCurrentImage(true);
                                            if (imageInput.current) {
                                                imageInput.current.value = "";
                                            }
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ) : (
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    ref={imageInput}
                                    className="block w-full text-sm text-gray-500
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-full file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-blue-50 file:text-blue-700
                                                hover:file:bg-blue-100"
                                />
                            )}
                        </div>
                    </div>

                </div>

                {/* Submit Button */}
                <div className="pt-4">
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {mode === "create" ? "Creating Event..." : "Updating Event..."}
                            </>
                        ) : mode === "create" ? (
                            "Create Event"
                        ) : (
                            "Update Event"
                        )}
                    </Button>
                </div>
            </form>
        </Form>

    )
}

export default EventForm