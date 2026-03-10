"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, CheckCircle2 } from "lucide-react";

interface VendorSLAAgreementProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAccept: () => void;
	onDecline: () => void;
	brandName?: string;
	businessAddress?: string;
}

export function VendorSLAAgreement({
	open,
	onOpenChange,
	onAccept,
	onDecline,
	brandName = "[VENDOR BRAND NAME]",
	businessAddress = "[VENDOR BUSINESS ADDRESS]",
}: VendorSLAAgreementProps) {
	const currentDate = new Date().toLocaleDateString("en-US", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] p-0">
				<DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-gray-50 to-white">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center">
							<FileText className="h-6 w-6 text-black" />
						</div>
						<div>
							<DialogTitle className="text-2xl font-bold text-gray-900">
								Vendor Platform Agreement
							</DialogTitle>
							<DialogDescription className="text-sm text-gray-600 mt-1">
								Please review and accept the terms to continue
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<ScrollArea className="h-[70vh] px-6 py-4">
					<div className="prose prose-sm max-w-none space-y-6 text-gray-800">
						{/* Header */}
						<div className="text-center border-b pb-6 mb-6">
							<h1 className="text-2xl font-bold text-gray-900 mb-2">
								STITCHES AFRICA VENDOR PLATFORM AGREEMENT
							</h1>
							<p className="text-sm text-gray-600">
								E-COMMERCE VENDOR PLATFORM AGREEMENT
							</p>
						</div>

						{/* Agreement Date and Parties */}
						<div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
							<p className="text-sm mb-3">
								<strong>THIS AGREEMENT</strong> is made on this{" "}
								<span className="font-semibold text-black">{currentDate}</span>
							</p>

							<div className="space-y-3">
								<div>
									<p className="font-semibold text-gray-900 mb-1">BETWEEN:</p>
									<p className="text-sm leading-relaxed">
										<strong>STITCHES AFRICA LIMITED</strong>, a company duly
										incorporated under the laws of the Federal Republic of
										Nigeria, with its principal business office at 8th Floor,
										CBC Towers, Off Admiralty, Lekki Phase 1, Lekki, Lagos State
										(hereinafter referred to as "the Company" or "Stitches
										Africa").
									</p>
								</div>

								<div>
									<p className="font-semibold text-gray-900 mb-1">AND:</p>
									<p className="text-sm leading-relaxed">
										<strong className="text-black">{brandName}</strong>, a
										vendor, trader, or merchant of African fashion (Ready to
										Wear and Bespoke fashion clothes and accessories) with its
										principal place of business at{" "}
										<span className="text-black">{businessAddress}</span>{" "}
										(hereinafter referred to as "the Vendor").
									</p>
								</div>
							</div>
						</div>

						{/* 1. PURPOSE AND DEFINITIONS */}
						<section>
							<h2 className="text-lg font-bold text-gray-900 mb-3">
								1. PURPOSE AND DEFINITIONS
							</h2>
							<div className="space-y-3">
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										1.1. Purpose
									</h3>
									<p className="text-sm leading-relaxed">
										This Agreement sets out the exclusive terms and conditions
										governing the Vendor's non-exclusive right to use the
										Stitches Africa e-commerce platform to display, advertise,
										and sell the Vendor's approved products to end customers.
									</p>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										1.2. Definitions
									</h3>
									<ul className="text-sm space-y-1 list-disc pl-5">
										<li>
											<strong>Effective Date:</strong> The date when this
											Agreement is fully executed
										</li>
										<li>
											<strong>Product(s):</strong> African dresses and related
											items supplied by the Vendor
										</li>
										<li>
											<strong>Customer:</strong> Any third-party purchasing
											Products through the Platform
										</li>
										<li>
											<strong>Sale Price:</strong> The final retail price
											including taxes but excluding logistics fees
										</li>
									</ul>
								</div>
							</div>
						</section>

						{/* 2. COMMENCEMENT AND DURATION */}
						<section>
							<h2 className="text-lg font-bold text-gray-900 mb-3">
								2. COMMENCEMENT AND DURATION
							</h2>
							<p className="text-sm leading-relaxed">
								This Agreement shall commence on the Effective Date and remain
								in full force for an initial period of one (1) year,
								automatically renewing for subsequent one (1) year periods,
								unless terminated earlier in accordance with Clause 12.
							</p>
						</section>

						{/* 3. SCOPE OF SERVICES */}
						<section>
							<h2 className="text-lg font-bold text-gray-900 mb-3">
								3. SCOPE OF SERVICES AND PLATFORM ACCESS
							</h2>
							<div className="space-y-3">
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										3.1. Company Obligations
									</h3>
									<p className="text-sm mb-2">
										The Company shall provide the Vendor with:
									</p>
									<ul className="text-sm space-y-1 list-disc pl-5">
										<li>
											Non-transferable, revocable right to access the Platform
										</li>
										<li>Integrated payment processing services</li>
										<li>Access to preferred logistics services</li>
										<li>Technical support for Platform functionality</li>
									</ul>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										3.2. Vendor Obligations
									</h3>
									<ul className="text-sm space-y-1 list-disc pl-5">
										<li>Use the Platform solely for lawful purposes</li>
										<li>
											Not redirect customers to other e-commerce channels
										</li>
										<li>Comply with all Stitches Africa policies</li>
										<li>
											Provide ordered items within 12-24 hours for Ready to Wear
											and 2 weeks for Bespoke items
										</li>
									</ul>
								</div>
							</div>
						</section>

						{/* 4. REGISTRATION AND WARRANTIES */}
						<section>
							<h2 className="text-lg font-bold text-gray-900 mb-3">
								4. REGISTRATION, REPRESENTATIONS, AND WARRANTIES
							</h2>
							<div className="space-y-3">
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										4.1. Registration and Approval
									</h3>
									<ul className="text-sm space-y-1 list-disc pl-5">
										<li>
											Vendor must provide accurate, current, and verifiable
											information
										</li>
										<li>
											Company reserves the right to approve, reject, or suspend
											any Vendor
										</li>
										<li>
											Vendor shall update changes within twenty-four (24) hours
										</li>
									</ul>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										4.2. Vendor Representations
									</h3>
									<p className="text-sm mb-2">The Vendor warrants that:</p>
									<ul className="text-sm space-y-1 list-disc pl-5">
										<li>
											It is duly authorized and has capacity to enter this
											Agreement
										</li>
										<li>
											It owns legal rights to sell all listed Products
										</li>
										<li>
											All Products are genuine, safe, and comply with applicable
											laws
										</li>
										<li>
											Execution does not conflict with existing obligations
										</li>
									</ul>
								</div>
							</div>
						</section>

						{/* 5. PRODUCT LISTING */}
						<section>
							<h2 className="text-lg font-bold text-gray-900 mb-3">
								5. PRODUCT LISTING, QUALITY, AND AUTHENTICITY
							</h2>
							<div className="space-y-3">
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										5.1. Product Standard
									</h3>
									<p className="text-sm mb-2">
										All Products must be:
									</p>
									<ul className="text-sm space-y-1 list-disc pl-5">
										<li>Authentic and not counterfeit</li>
										<li>Accurately described with truthful images</li>
										<li>Free from material or workmanship defects</li>
									</ul>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										5.2. Quality Control
									</h3>
									<p className="text-sm leading-relaxed">
										Stitches Africa reserves the right to vet, review, modify,
										or remove any Product listing. Non-compliance may result in
										delisting, account suspension, penalty fees, or immediate
										termination.
									</p>
								</div>
							</div>
						</section>

						{/* 6. PRICING AND COMMISSION */}
						<section>
							<h2 className="text-lg font-bold text-gray-900 mb-3">
								6. PRICING, COMMISSION, AND PAYMENT TERMS
							</h2>
							<div className="space-y-3">
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										6.1. Pricing
									</h3>
									<p className="text-sm leading-relaxed">
										The Vendor shall set the Sale Price for each Product. Prices
										should be competitive and not exceed prices on other
										channels.
									</p>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										6.2. Commission and Fees
									</h3>
									<p className="text-sm leading-relaxed">
										<strong>Commission Rate:</strong> Stitches Africa shall
										charge a commission of <strong>20%</strong> per net Sale
										Price of each completed transaction, subject to change with
										fifteen (15) days' written notice.
									</p>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										6.3. Payment to Vendor
									</h3>
									<ul className="text-sm space-y-1 list-disc pl-5">
										<li>
											Company deducts Commission, fees, and taxes before
											remitting Net Proceeds
										</li>
										<li>
											Payment upon confirmation of delivery by DHL Order
											confirmation
										</li>
										<li>
											Vendor responsible for product replacement within 24 hours
											if defective
										</li>
										<li>
											Vendor solely responsible for applicable taxes and levies
										</li>
									</ul>
								</div>
							</div>
						</section>

						{/* 7. DELIVERY AND LOGISTICS */}
						<section>
							<h2 className="text-lg font-bold text-gray-900 mb-3">
								7. DELIVERY AND LOGISTICS
							</h2>
							<div className="space-y-3">
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										7.1. Responsibility
									</h3>
									<p className="text-sm leading-relaxed">
										Vendor may handle delivery directly or use Stitches Africa's
										approved logistics partners. Products must be ready for
										pickup within twenty-four (24) hours of order confirmation.
									</p>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										7.2. Risk of Loss
									</h3>
									<p className="text-sm leading-relaxed">
										Vendor bears entire risk of loss or damage until Product is
										delivered to and accepted by the Customer or logistics
										partner.
									</p>
								</div>
							</div>
						</section>

						{/* 8. RETURN AND REFUND */}
						<section>
							<h2 className="text-lg font-bold text-gray-900 mb-3">
								8. RETURN, REFUND, AND EXCHANGE POLICY
							</h2>
							<div className="space-y-3">
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										8.1. Compliance
									</h3>
									<p className="text-sm leading-relaxed">
										Vendor shall strictly comply with Stitches Africa's Return,
										Refund, and Exchange Policy.
									</p>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										8.2. Vendor Acceptance
									</h3>
									<p className="text-sm mb-2">
										Vendor must accept returns and bear costs for:
									</p>
									<ul className="text-sm space-y-1 list-disc pl-5">
										<li>Defective, damaged, or incorrect items</li>
										<li>Non-conformity with product description</li>
										<li>Customer's statutory right of return</li>
									</ul>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										8.3. Refund Processing
									</h3>
									<p className="text-sm leading-relaxed">
										All refunds processed through the Platform. Costs borne by
										Customer except in cases of product defect by Vendor.
									</p>
								</div>
							</div>
						</section>

						{/* 9. INTELLECTUAL PROPERTY */}
						<section>
							<h2 className="text-lg font-bold text-gray-900 mb-3">
								9. INTELLECTUAL PROPERTY
							</h2>
							<div className="space-y-3">
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										9.1. Vendor IP
									</h3>
									<p className="text-sm leading-relaxed">
										Vendor retains ownership of trademarks, logos, and content
										but grants Stitches Africa a non-exclusive, royalty-free,
										worldwide, perpetual license to use for Platform promotion.
									</p>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										9.2. Company IP
									</h3>
									<p className="text-sm leading-relaxed">
										Platform, software, interface, and "Stitches Africa"
										trademarks remain exclusive property of Stitches Africa.
										Vendor granted limited, revocable license only.
									</p>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										9.3. Warranty Against Infringement
									</h3>
									<p className="text-sm leading-relaxed">
										Vendor warrants that Products and Vendor IP will not
										infringe third-party intellectual property rights.
									</p>
								</div>
							</div>
						</section>

						{/* 10. CONFIDENTIALITY */}
						<section>
							<h2 className="text-lg font-bold text-gray-900 mb-3">
								10. CONFIDENTIALITY AND DATA PROTECTION
							</h2>
							<div className="space-y-3">
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										10.1. Confidentiality
									</h3>
									<p className="text-sm leading-relaxed">
										Both Parties agree to maintain strict confidentiality of all
										non-public business information, pricing, and technical data.
									</p>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										10.2. Data Protection
									</h3>
									<p className="text-sm leading-relaxed">
										Stitches Africa complies with Nigeria Data Protection
										Regulation (NDPR). Vendor prohibited from retaining, selling,
										or misusing customer data obtained through the Platform.
										Breach is material breach of Agreement.
									</p>
								</div>
							</div>
						</section>

						{/* 11. INDEMNITY */}
						<section>
							<h2 className="text-lg font-bold text-gray-900 mb-3">
								11. INDEMNITY AND LIMITATION OF LIABILITY
							</h2>
							<div className="space-y-3">
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										11.1. Indemnity by Vendor
									</h3>
									<p className="text-sm mb-2">
										Vendor agrees to defend, indemnify, and hold harmless
										Stitches Africa from claims arising from:
									</p>
									<ul className="text-sm space-y-1 list-disc pl-5">
										<li>Breach of Vendor Representations and Warranties</li>
										<li>Sale of counterfeit, defective, or non-compliant Products</li>
										<li>Intellectual property infringement claims</li>
										<li>Negligent acts or willful misconduct by Vendor</li>
									</ul>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										11.2. Limitation of Company Liability
									</h3>
									<p className="text-sm leading-relaxed">
										Stitches Africa shall not be liable for indirect, special,
										incidental, or consequential damages. Total liability shall
										not exceed Commissions earned in preceding three (3) months.
									</p>
								</div>
							</div>
						</section>

						{/* 12. TERMINATION */}
						<section>
							<h2 className="text-lg font-bold text-gray-900 mb-3">
								12. TERMINATION
							</h2>
							<div className="space-y-3">
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										12.1. Termination by Notice
									</h3>
									<p className="text-sm leading-relaxed">
										Either Party may terminate with Thirty (30) days' written
										notice.
									</p>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										12.2. Immediate Termination
									</h3>
									<p className="text-sm mb-2">
										Stitches Africa may terminate immediately for:
									</p>
									<ul className="text-sm space-y-1 list-disc pl-5">
										<li>Material breach not remedied within seven (7) days</li>
										<li>Fraud, gross misconduct, or illegal activity</li>
										<li>Account inactive for Ninety (90) days</li>
										<li>
											Seller rating below benchmark for thirty (30) days
										</li>
									</ul>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										12.3. Effects of Termination
									</h3>
									<ul className="text-sm space-y-1 list-disc pl-5">
										<li>Immediately cease Platform use</li>
										<li>Fulfill all outstanding orders</li>
										<li>Settle amounts owed within seven (7) days</li>
										<li>
											IP, Confidentiality, Indemnity, and Dispute clauses survive
										</li>
									</ul>
								</div>
							</div>
						</section>

						{/* 13. GOVERNING LAW */}
						<section>
							<h2 className="text-lg font-bold text-gray-900 mb-3">
								13. GOVERNING LAW AND DISPUTE RESOLUTION
							</h2>
							<div className="space-y-3">
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										13.1. Governing Law
									</h3>
									<p className="text-sm leading-relaxed">
										This Agreement shall be governed by the laws of the Federal
										Republic of Nigeria.
									</p>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										13.2. Dispute Resolution
									</h3>
									<ul className="text-sm space-y-1 list-disc pl-5">
										<li>
											First attempt amicable resolution within fourteen (14) days
										</li>
										<li>
											Failing resolution, submit to binding arbitration in Lagos,
											Nigeria per Arbitration and Mediation Act 2023
										</li>
									</ul>
								</div>
							</div>
						</section>

						{/* 14. GENERAL PROVISIONS */}
						<section>
							<h2 className="text-lg font-bold text-gray-900 mb-3">
								14. GENERAL PROVISIONS
							</h2>
							<div className="space-y-3">
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										14.1. Notices
									</h3>
									<p className="text-sm leading-relaxed">
										All notices shall be in writing and delivered by hand,
										registered mail, courier, or email with delivery receipt.
									</p>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										14.2. Entire Agreement
									</h3>
									<p className="text-sm leading-relaxed">
										This Agreement constitutes entire understanding and
										supersedes all prior agreements. Amendments must be in
										writing and signed by both Parties.
									</p>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										14.3. Severability
									</h3>
									<p className="text-sm leading-relaxed">
										If any provision is held invalid, remaining provisions remain
										in full force.
									</p>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										14.4. Relationship of Parties
									</h3>
									<p className="text-sm leading-relaxed">
										Vendor is an independent contractor. Nothing establishes
										partnership, joint venture, employment, or agency
										relationship.
									</p>
								</div>
							</div>
						</section>

						{/* Acceptance Notice */}
						<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
							<div className="flex items-start gap-3">
								<CheckCircle2 className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
								<div className="text-sm text-amber-900">
									<p className="font-semibold mb-1">
										By clicking "Accept Agreement", you acknowledge that:
									</p>
									<ul className="space-y-1 list-disc pl-5">
										<li>You have read and understood this entire Agreement</li>
										<li>
											You agree to be bound by all terms and conditions stated
											above
										</li>
										<li>
											You have the authority to enter into this Agreement on
											behalf of your business
										</li>
										<li>
											The information provided is accurate and complete
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</ScrollArea>

				<DialogFooter className="px-6 py-4 border-t bg-gray-50 flex-row gap-3">
					<Button
						variant="outline"
						onClick={onDecline}
						className="flex-1 sm:flex-none"
					>
						Decline
					</Button>
					<Button
						onClick={onAccept}
						className="flex-1 sm:flex-none bg-black hover:bg-gray-800"
					>
						Accept Agreement
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
