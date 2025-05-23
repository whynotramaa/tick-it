"use client"

import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs'
import { useMutation } from 'convex/react';
import React, { useEffect } from 'react'

function SyncUsersWithConvex() {

    const { user } = useUser();
    // update user here
    const updateUser = useMutation(api.users.updateUser)

    useEffect(()=>{
        if(!user) return

        const syncUser = async () => {
            try {
                await updateUser({
                    userId: user.id,
                    name:`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
                    email: user.emailAddresses[0].emailAddress ?? "" 
                })
            } catch (error) {
                console.log("Error syncing user -->", error)
            }
        }

        syncUser()
    }, [user, updateUser]);

  return (
    <div></div>
  )
}

export default SyncUsersWithConvex