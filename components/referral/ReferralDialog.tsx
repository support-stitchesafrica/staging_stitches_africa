"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export default function ReferralDialog()
{
    const [open, setOpen] = useState(false);
    const router = useRouter();

    useEffect(() =>
    {
        const hideReferral = localStorage.getItem("hideReferralDialog");
        if (!hideReferral)
        {
            setTimeout(() => setOpen(true), 800);
        }
    }, []);

    const handleDontShow = () =>
    {
        localStorage.setItem("hideReferralDialog", "true");
        setOpen(false);
    };

    const handleStart = () =>
    {
        localStorage.setItem("hideReferralDialog", "true");
        router.push("/referral/dashboard");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className="
                    max-w-[420px] 
                    bg-[#0F0F0F] 
                    text-white 
                    rounded-2xl 
                    px-6 
                    py-8 
                    relative
                    border-0
                "
            >
                {/* Close Button */}
                <button
                    className="absolute right-4 top-4 text-gray-400 hover:text-white z-10"
                    onClick={() => setOpen(false)}
                >
                    <X size={18} />
                </button>

                {/* Title */}
                <h2 className="text-2xl font-bold text-center mb-2">
                    Refer & Earn <span className="inline-block">💰</span>
                </h2>

                {/* Subtitle */}
                <p className="text-center text-gray-300 mb-5 text-sm leading-relaxed">
                    Invite your friends to Stitches Africa and earn exciting rewards for every
                    successful signup. Start sharing your referral link today.
                </p>

                {/* Image */}
                <div className="flex justify-center mb-6">
                    <Image
                        src="/images/referal.png"
                        alt="referral"
                        width={150}
                        height={150}
                        className="rounded-lg"
                    />
                </div>

                {/* Start Button */}
                <Button
                    className="w-full text-black font-semibold bg-white hover:bg-gray-200 py-5"
                    onClick={handleStart}
                >
                    Start Earning
                </Button>

                {/* Don't Show Again */}
                <button
                    className="
                        w-full 
                        mt-3 
                        text-sm 
                        text-gray-300 
                        border 
                        border-gray-700 
                        rounded-lg 
                        py-3 
                        hover:bg-gray-800
                    "
                    onClick={handleDontShow}
                >
                    Don't Show This Again
                </button>
            </DialogContent>
        </Dialog>
    );
}
