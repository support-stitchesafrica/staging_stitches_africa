import React from "react";
import Link from "next/link";

export default function Footer()
{
	return (
		<footer className="bg-black text-gray-400 py-4">
			<div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center">
				{/* Left Side */}
				<p className="text-sm">© Stitches Africa {new Date().getFullYear()}</p>

				{/* Right Side */}
				<div className="flex space-x-6 mt-2 sm:mt-0">
					<Link
						href="https://www.instagram.com/mystitchesafrica/"
						target="_blank"
						rel="noopener noreferrer"
						className="text-sm hover:text-white transition"
					>
						INSTAGRAM
					</Link>
					<Link
						href="https://x.com/stitchesafrica?s=21"
						target="_blank"
						rel="noopener noreferrer"
						className="text-sm hover:text-white transition"
					>
						TWITTER
					</Link>
					{/* <Link href="#" className="text-sm hover:text-white transition">
						YOUTUBE
					</Link> */}
				</div>
			</div>

			{/* Official Disclaimer Notice */}
			<div className="max-w-7xl mx-auto px-4 mt-4 pt-4 border-t border-gray-800 text-center">
				<p className="text-xs text-gray-500">
					Official website:{" "}
					<a
						href="https://staging-stitches-africa.vercel.app"
						target="_blank"
						rel="noopener noreferrer"
						className="text-gray-300 hover:text-white underline"
					>
						https://staging-stitches-africa.vercel.app
					</a>
					{" "}• Please shop only through our official website
				</p>
			</div>
		</footer>
	);
}