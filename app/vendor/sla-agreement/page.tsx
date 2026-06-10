"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VendorSLAContent } from "@/components/vendor/VendorSLAContent";

export default function VendorSLAPage()
{
	const router = useRouter();

	const handlePrint = () =>
	{
		window.print();
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="bg-white border-b sticky top-0 z-10 print:hidden">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => router.back()}
								className="gap-2"
							>
								<ArrowLeft className="h-4 w-4" />
								Back
							</Button>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center">
									<FileText className="h-5 w-5 text-black" />
								</div>
								<div>
									<h1 className="text-lg font-bold text-gray-900">
										Vendor Platform Agreement
									</h1>
									<p className="text-sm text-gray-600">
										Stitches Africa Limited
									</p>
								</div>
							</div>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={handlePrint}
							className="gap-2"
						>
							<Download className="h-4 w-4" />
							Download PDF
						</Button>
					</div>
				</div>
			</div>

			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="bg-white rounded-lg shadow-sm border p-6 sm:p-8 lg:p-12">
					<VendorSLAContent
						brandName="[VENDOR NAME]"
						businessAddress="[VENDOR ADDRESS]"
					/>

					<div className="mt-12 pt-6 border-t text-center text-sm text-gray-600">
						<p>
							© {new Date().getFullYear()} Stitches Africa Limited. All rights
							reserved.
						</p>
						<p className="mt-2">
							For questions or concerns, contact:{" "}
							<a
								href="mailto:info@stitchesafrica.com"
								className="text-black font-medium hover:underline"
							>
								info@stitchesafrica.com
							</a>
						</p>
					</div>
				</div>

				<div className="mt-6 text-center print:hidden">
					<Link href="/vendor/dashboard">
						<Button variant="outline" className="gap-2">
							<ArrowLeft className="h-4 w-4" />
							Back to Dashboard
						</Button>
					</Link>
				</div>
			</div>

			<style jsx global>{`
				@media print {
					body {
						print-color-adjust: exact;
						-webkit-print-color-adjust: exact;
					}
					.print\\:hidden {
						display: none !important;
					}
				}
			`}</style>
		</div>
	);
}
