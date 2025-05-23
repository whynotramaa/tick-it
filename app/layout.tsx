import type { Metadata } from "next";
import { Questrial } from "next/font/google"; // Import Questrial
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import Header from "@/components/Header";
import SyncUsersWithConvex from "@/components/SyncUsersWithConvex";

// Configure Questrial
const questrial = Questrial({
  variable: "--font-questrial", // Define a CSS variable for your font
  subsets: ["latin"],
  weight: "400", // Questrial only has a single weight (Regular 400)
});

export const metadata: Metadata = {
  title: "Tick'It -- Events Made Easy",
  description: `Ever feel like you're missing out on the best your city has to offer? At Tick'it, we make sure that's a thing of the past. We're your go-to platform for effortlessly discovering and booking the most exciting events happening around you.
From electrifying concerts and captivating workshops to lively festivals and unique culinary adventures, Tick'it curates the best of your city in one convenient place.
Forget endless searching and complicated bookings. With Tick'it, finding and securing your next unforgettable moment is simple, secure, and just a few clicks away.

Don't just hear about it. Experience it. Get your Tick'it.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${questrial.variable} antialiased`} // Apply the Questrial font variable
      >
        <ConvexClientProvider>
          <ClerkProvider>
            <Header />
            <SyncUsersWithConvex />
            {children}
          </ClerkProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}