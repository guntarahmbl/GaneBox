"use client";
import Link from "next/link";
import React from "react";
import {useSession, signOut} from "next-auth/react";
import Signup from "./components/signin";
import "./globals.css";
import ChooseRole from "./components/ChooseRole";
export default function Home() {
  const { data:session } = useSession();

  return ( 
    <main className="flex h-screen flex-col items-center w-[80%]">

      {session ? (
        <ChooseRole />
      ):(
        
        <Signup />
      )}
    </main>
  );
}
