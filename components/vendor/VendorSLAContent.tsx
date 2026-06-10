"use client";

import { CheckCircle2 } from "lucide-react";

export type VendorSLAContentProps = {
	brandName?: string;
	businessAddress?: string;
	/** Show electronic-acceptance notice (signup modal). */
	showAcceptanceNotice?: boolean;
};

export function VendorSLAContent({
	brandName = "[VENDOR BRAND NAME]",
	businessAddress = "[VENDOR BUSINESS ADDRESS]",
	showAcceptanceNotice = false,
}: VendorSLAContentProps)
{
	const currentDate = new Date().toLocaleDateString("en-US", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	return (
		<div className="prose prose-sm max-w-none space-y-6 text-gray-800">
			<div className="text-center border-b pb-6 mb-6">
				<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
					STITCHES AFRICA VENDOR PLATFORM AGREEMENT
				</h1>
				<p className="text-sm text-gray-600">
					THIS E-COMMERCE VENDOR PLATFORM AGREEMENT
				</p>
			</div>

			<div className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-200">
				<p className="text-sm mb-3">
					<strong>THIS E-COMMERCE VENDOR PLATFORM AGREEMENT</strong> (&quot;Agreement&quot;) is made on this{" "}
					<span className="font-semibold text-black">{currentDate}</span>.
				</p>

				<div className="space-y-3">
					<div>
						<p className="font-semibold text-gray-900 mb-1">BETWEEN:</p>
						<p className="text-sm leading-relaxed">
							<strong>STITCHES AFRICA LIMITED</strong>, a company duly incorporated under the laws of the Federal Republic of Nigeria, with its principal business office at 8th Floor, CBC Towers, Off Admiralty, Lekki Phase 1, Lekki, Lagos State (hereinafter referred to as &quot;the Company&quot; or &quot;Stitches Africa&quot;, which expression shall, where the context so admits, include its successors-in-title and assigns).
						</p>
					</div>

					<div>
						<p className="font-semibold text-gray-900 mb-1">AND:</p>
						<p className="text-sm leading-relaxed">
							<strong className="text-black">{brandName}</strong>, a vendor, trader, or merchant of African fashion (Ready to Wear (RTW) and Bespoke fashion clothes and accessories) with its principal place of business at{" "}
							<span className="text-black">{businessAddress}</span> (hereinafter referred to as &quot;the Vendor&quot;, which expression shall, where the context so admits, include its successors-in-title and assigns).
						</p>
					</div>

					<p className="text-sm leading-relaxed">
						In this Agreement, the Company and the Vendor are hereinafter collectively referred to as the &quot;Parties&quot; and individually as a &quot;Party&quot;.
					</p>
				</div>
			</div>

			<section>
				<h2 className="text-lg font-bold text-gray-900 mb-3">1. PURPOSE AND DEFINITIONS</h2>
				<div className="space-y-3">
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">1.1. Purpose</h3>
						<p className="text-sm leading-relaxed">
							This Agreement sets out the exclusive terms and conditions governing the Vendor&apos;s non-exclusive right to use the Stitches Africa e-commerce platform (the &quot;Platform&quot; or &quot;e-commerce Platform&quot;) to display, advertise, and sell the Vendor&apos;s approved products to end customers.
						</p>
					</div>
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">1.2. Definitions</h3>
						<ul className="text-sm space-y-2 list-none pl-0">
							<li><strong>&quot;Effective Date&quot;:</strong> The date first written above when this Agreement is fully executed by both Parties.</li>
							<li><strong>&quot;Product(s)&quot;:</strong> The African dresses and related items supplied by the Vendor and approved for listing on the Platform.</li>
							<li><strong>&quot;Customer&quot;:</strong> Any third-party purchasing Products from the Vendor through the Platform.</li>
							<li><strong>&quot;Sale Price&quot;:</strong> The final retail price of the Product listed on the Platform, including any applicable taxes but excluding logistics fees.</li>
						</ul>
					</div>
				</div>
			</section>

			<section>
				<h2 className="text-lg font-bold text-gray-900 mb-3">2. COMMENCEMENT AND DURATION</h2>
				<p className="text-sm leading-relaxed">
					This Agreement shall commence on the Effective Date and shall remain in full force and effect for an initial period of one (1) year, automatically renewing for subsequent one (1) year period, unless terminated earlier in accordance with Clause 12 of this Agreement.
				</p>
			</section>

			<section>
				<h2 className="text-lg font-bold text-gray-900 mb-3">3. SCOPE OF SERVICES AND PLATFORM ACCESS</h2>
				<div className="space-y-3">
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">3.1. Company Obligations (Stitches Africa)</h3>
						<p className="text-sm mb-2">The Company shall provide the Vendor with a non-transferable, revocable right to access the Platform to:</p>
						<ul className="text-sm space-y-1 list-[lower-alpha] pl-5">
							<li>List, promote, and sell approved Products to Customers.</li>
							<li>Utilize integrated payment processing services for sales transactions.</li>
							<li>Access Stitches Africa&apos;s preferred or mandated logistics services.</li>
							<li>Provide technical support for Platform functionality, but not for the Vendor&apos;s own devices or networks.</li>
						</ul>
					</div>
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">3.2. Vendor Obligations</h3>
						<ul className="text-sm space-y-2 list-[lower-alpha] pl-5">
							<li><strong>Lawful Use:</strong> The Vendor shall use the Platform solely for lawful purposes and only to sell Products that are consistent with the Platform&apos;s guidelines and the description approved by the Company.</li>
							<li><strong>Exclusivity of Listings:</strong> The Vendor shall not redirect customers from the Platform to any other e-commerce channel or external sales avenue.</li>
							<li><strong>Compliance with Policies:</strong> The Vendor shall strictly comply with all Stitches Africa&apos;s operational, technical, and commercial policies as may be updated and communicated from time to time, including but not limited to the Product Quality Policy, Return and Refund Policy, and Vendor Code of Conduct.</li>
						</ul>
						<p className="text-sm leading-relaxed mt-2">
							To provide the ordered items within 12 to 24 hours for Ready to Wear Outfits and 2 Weeks for Bespoke Items made on the platform and the request communicated by Stitches Africa to Vendor.
						</p>
					</div>
				</div>
			</section>

			<section>
				<h2 className="text-lg font-bold text-gray-900 mb-3">4. REGISTRATION, REPRESENTATIONS, AND WARRANTIES</h2>
				<div className="space-y-3">
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">4.1. Registration and Approval</h3>
						<ul className="text-sm space-y-2 list-[lower-alpha] pl-5">
							<li><strong>Vendor Information:</strong> The Vendor must complete the Company&apos;s registration process, providing accurate, current, and verifiable information, including all required legal and regulatory documents.</li>
							<li><strong>Right to Reject:</strong> The Company reserves the right, in its sole and absolute discretion, to approve, reject, or suspend any Vendor application or continued participation, with or without cause.</li>
							<li><strong>Updates:</strong> The Vendor shall promptly update all changes to its profile, business information, product stock levels, and pricing within twenty-four (24) hours.</li>
						</ul>
					</div>
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">4.2. Vendor Representations and Warranties</h3>
						<p className="text-sm mb-2">The Vendor represents and warrants to Stitches Africa that:</p>
						<ul className="text-sm space-y-2 list-[lower-alpha] pl-5">
							<li><strong>Authority:</strong> It is duly authorized, registered, and has the necessary capacity to enter into this Agreement and carry out its obligations.</li>
							<li><strong>Product Rights:</strong> It owns or possesses the unfettered legal rights to sell and distribute all Products listed on the Platform, free from all liens and encumbrances.</li>
							<li><strong>Legality:</strong> All Products are genuine, safe, lawful, and comply with all applicable Nigerian and international laws, standards, and regulations, including intellectual property, labeling, and consumer protection laws.</li>
							<li><strong>No Conflict:</strong> The execution of this Agreement does not conflict with any existing obligation of the Vendor.</li>
						</ul>
					</div>
				</div>
			</section>

			<section>
				<h2 className="text-lg font-bold text-gray-900 mb-3">5. PRODUCT LISTING, QUALITY, AND AUTHENTICITY</h2>
				<div className="space-y-3">
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">5.1. Product Standard</h3>
						<p className="text-sm mb-2">The Vendor shall ensure all listed Products meet the highest industry and quality standards and must be:</p>
						<ul className="text-sm space-y-1 list-[lower-roman] pl-5">
							<li><strong>Authentic:</strong> Genuine, and not counterfeit, replicated, or fraudulently sourced.</li>
							<li><strong>Accurately Described:</strong> All images, specifications, and descriptions must be truthful, non-misleading, and exactly match the Product delivered to the Customer.</li>
							<li><strong>Free from Defects:</strong> Products must be new (unless explicitly stated otherwise and approved by Stitches Africa) and free from any material or workmanship defects.</li>
						</ul>
					</div>
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">5.2. Quality Control and Delisting (Protecting Stitches Africa)</h3>
						<p className="text-sm mb-2">
							<strong>Platform Control:</strong> Stitches Africa reserves the absolute right to vet, review, audit, modify, or remove any Product listing, image, or content that, in the Company&apos;s opinion, violates this Agreement, platform policies, or customer standards, or may expose the Company to liability.
						</p>
						<p className="text-sm mb-2"><strong>Penalties for Non-Compliance:</strong> If the Vendor is found to be selling non-compliant, counterfeit, or misrepresented Products, Stitches Africa may immediately:</p>
						<ul className="text-sm space-y-1 list-[lower-roman] pl-5">
							<li>Delist the offending Product;</li>
							<li>Suspend the Vendor&apos;s account;</li>
							<li>Levy a penalty fee; and</li>
							<li>Immediately terminate this Agreement</li>
						</ul>
					</div>
				</div>
			</section>

			<section>
				<h2 className="text-lg font-bold text-gray-900 mb-3">6. PRICING, COMMISSION, AND PAYMENT TERMS</h2>
				<div className="space-y-3">
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">6.1. Pricing</h3>
						<p className="text-sm leading-relaxed">
							The Vendor shall set the Sale Price for each Product. The Vendor warrants that the price listed on the Platform should be itemized at the price offered through any of its other sales channels, including its own website or physical stores.
						</p>
					</div>
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">6.2. Commission and Fees</h3>
						<ul className="text-sm space-y-2 list-[lower-alpha] pl-5">
							<li><strong>Commission Rate:</strong> Stitches Africa shall charge a commission of 20% per net Sale Price of each completed transaction (&quot;Commission&quot;), or as may be updated by not less than fifteen (15) days&apos; written notice to the Vendor.</li>
							<li><strong>Other Fees:</strong> Additional service fees (e.g., for premium listings, logistics, or advertising) shall be mutually agreed upon in writing before being applied.</li>
						</ul>
					</div>
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">6.3. Payment to Vendor (Protecting Stitches Africa)</h3>
						<ul className="text-sm space-y-2 list-[lower-alpha] pl-5">
							<li><strong>Deduction:</strong> The Company shall deduct its Commission, any applicable service fees, return/refund costs, and statutory withholding taxes (if required by law) from the Sale Price before remitting the balance (&quot;Net Proceeds&quot;) to the Vendor.</li>
							<li><strong>Payout Schedule:</strong> Payments of Net Proceeds to the Vendor is automated and payment to the vendor will be upon confirmation of delivery to Customer by Stitches Africa Delivery Partners — order confirmation, verifiable delivery completion, and in the event of a delivery return due to defects of products by vendor, as per the Company&apos;s policy. The Vendor takes full responsibility to replace the product within 24 hours of notification by Stitches Africa.</li>
							<li><strong>Tax Liability:</strong> The Vendor is solely responsible for all applicable taxes, levies, duties, or statutory deductions arising from the sale of the Products, save for those required to be withheld by the Company by law.</li>
						</ul>
					</div>
				</div>
			</section>

			<section>
				<h2 className="text-lg font-bold text-gray-900 mb-3">7. DELIVERY AND LOGISTICS</h2>
				<div className="space-y-3">
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">7.1. Responsibility</h3>
						<ul className="text-sm space-y-2 list-[lower-alpha] pl-5">
							<li><strong>Options:</strong> The Vendor may either: (i) Handle all delivery and logistics directly (subject to Stitches Africa&apos;s quality standards); or (ii) Mandate the use of Stitches Africa&apos;s approved logistics partners at a cost to be mutually agreed by both parties.</li>
							<li><strong>Timely Handover:</strong> Where Stitches Africa or its partner handles logistics, the Vendor shall ensure the Product is ready and available for pickup at the designated location within twenty-four (24) hours of receiving an order confirmation.</li>
						</ul>
					</div>
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">7.2. Risk of Loss (Protecting Stitches Africa)</h3>
						<p className="text-sm leading-relaxed">
							The Vendor bears the entire risk of loss or damage to the Product until it is physically delivered to and accepted by Stitches Africa or the designated logistics partner (whichever is earlier). The Vendor shall be responsible for adequate packaging.
						</p>
					</div>
				</div>
			</section>

			<section>
				<h2 className="text-lg font-bold text-gray-900 mb-3">8. RETURN, REFUND, AND EXCHANGE POLICY</h2>
				<div className="space-y-3">
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">8.1. Compliance</h3>
						<p className="text-sm leading-relaxed">
							The Vendor shall strictly comply with and accept the terms of Stitches Africa&apos;s current and future Return, Refund, and Exchange Policy (the &quot;Policy&quot;). The Policy shall be binding on the Vendor.
						</p>
					</div>
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">8.2. Vendor Acceptance</h3>
						<p className="text-sm mb-2">The Vendor must accept the return of Products and bear the costs associated with the return in cases of:</p>
						<ul className="text-sm space-y-1 list-[lower-roman] pl-5">
							<li>Defective, damaged, or incorrect items.</li>
							<li>Non-conformity with the product description or the high standards represented on the Platform.</li>
							<li>Customer&apos;s exercise of any statutory or Policy-stipulated right of return.</li>
						</ul>
					</div>
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">8.3. Refund Processing</h3>
						<p className="text-sm leading-relaxed">
							All refunds to Customers shall be processed exclusively through the Platform, and the associated costs shall be borne by the Customer except in cases of product defect by Vendor in such cases, the cost of refunds shall be via a deduction from the Net Proceeds of the Vendor.
						</p>
					</div>
				</div>
			</section>

			<section>
				<h2 className="text-lg font-bold text-gray-900 mb-3">9. INTELLECTUAL PROPERTY (Protecting Stitches Africa)</h2>
				<div className="space-y-3">
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">9.1. Vendor IP</h3>
						<ul className="text-sm space-y-2 list-[lower-alpha] pl-5">
							<li><strong>Ownership:</strong> The Vendor retains ownership of its trademarks, logos, product images, and content (&quot;Vendor IP&quot;).</li>
							<li><strong>License to Stitches Africa:</strong> The Vendor grants Stitches Africa a non-exclusive, royalty-free, worldwide, perpetual, and irrevocable license to use, reproduce, display, and market the Vendor IP for the purpose of promoting the Vendor, the Products, and the Platform.</li>
						</ul>
					</div>
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">9.2. Company IP</h3>
						<p className="text-sm leading-relaxed">
							The Platform, its underlying software, interface, trademarks (including &quot;Stitches Africa&quot;), copyrights, and all content created by the Company (&quot;Company IP&quot;) remain the exclusive property of Stitches Africa. The Vendor is granted a limited, revocable, non-transferable license only for the term of this Agreement and shall not copy, modify, or commercially exploit the Company IP.
						</p>
					</div>
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">9.3. Warranty Against Infringement (Critical Protection)</h3>
						<p className="text-sm leading-relaxed">
							The Vendor warrants that the listing and sale of its Products and the use of the Vendor IP on the Platform will not infringe upon any third-party intellectual property rights (including copyrights, patents, and trademarks).
						</p>
					</div>
				</div>
			</section>

			<section>
				<h2 className="text-lg font-bold text-gray-900 mb-3">10. CONFIDENTIALITY AND DATA PROTECTION</h2>
				<div className="space-y-3">
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">10.1. Confidentiality</h3>
						<p className="text-sm leading-relaxed">
							Both Parties agree to maintain the strict confidentiality of all non-public business information, pricing structures, marketing plans, and technical data exchanged (&quot;Confidential Information&quot;) and shall not disclose or use same for any purpose other than fulfilling the obligations of this Agreement, without prior written consent.
						</p>
					</div>
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">10.2. Data Protection (Protecting Stitches Africa)</h3>
						<ul className="text-sm space-y-2 list-[lower-alpha] pl-5">
							<li><strong>Compliance:</strong> Stitches Africa shall comply with the Nigeria Data Protection Regulation (NDPR) in handling vendor and customer data.</li>
							<li><strong>Misuse Prohibition:</strong> The Vendor is expressly prohibited from retaining, selling, or misusing any customer data (names, addresses, contact details) obtained through the Platform for unauthorized marketing, external communications, or any third-party disclosure. Breach of this clause is a material breach of this Agreement.</li>
						</ul>
					</div>
				</div>
			</section>

			<section>
				<h2 className="text-lg font-bold text-gray-900 mb-3">11. INDEMNITY AND LIMITATION OF LIABILITY (Critical Protection)</h2>
				<div className="space-y-3">
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">11.1. Indemnity by Vendor</h3>
						<p className="text-sm mb-2">
							The Vendor agrees to defend, indemnify, and hold harmless Stitches Africa, its officers, directors, agents, and employees from and against any and all losses, liabilities, claims, actions, suits, damages, and expenses (including reasonable legal fees) arising from or in connection with:
						</p>
						<ul className="text-sm space-y-1 list-[lower-alpha] pl-5">
							<li>Any breach of the Vendor Representations and Warranties (Clause 4.2).</li>
							<li>The sale of counterfeit, defective, or non-compliant Products.</li>
							<li>Any claim of intellectual property infringement related to the Products or Vendor IP.</li>
							<li>Any negligent act, omission, or willful misconduct by the Vendor.</li>
						</ul>
					</div>
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">11.2. Limitation of Company Liability</h3>
						<p className="text-sm leading-relaxed uppercase">
							STITCHES AFRICA SHALL NOT BE LIABLE to the Vendor for any indirect, special, incidental, punitive, or consequential damages, including loss of profits or business interruption, arising from the use of the Platform. In all events, the total cumulative liability of Stitches Africa to the Vendor under this Agreement shall not exceed the total Commissions earned by the Company from the Vendor in the preceding three (3) calendar months.
						</p>
					</div>
				</div>
			</section>

			<section>
				<h2 className="text-lg font-bold text-gray-900 mb-3">12. TERMINATION</h2>
				<div className="space-y-3">
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">12.1. Termination by Notice</h3>
						<p className="text-sm leading-relaxed">
							Either Party may terminate this Agreement by giving Thirty (30) days&apos; written notice to the other Party.
						</p>
					</div>
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">12.2. Immediate Termination by Stitches Africa</h3>
						<p className="text-sm mb-2">Stitches Africa may terminate this Agreement immediately upon written notice where:</p>
						<ul className="text-sm space-y-1 list-[lower-roman] pl-5">
							<li>The Vendor breaches any material term of this Agreement (including Clauses 5, 9, or 10) and fails to remedy the breach within seven (7) days of receiving notice.</li>
							<li>Fraud, gross misconduct, or illegal activity on the Platform is detected.</li>
							<li>The Vendor&apos;s account remains inactive for a period exceeding Ninety (90) days.</li>
							<li>The Vendor&apos;s seller rating falls below a benchmark set by Stitches Africa for a continuous period of thirty (30) days.</li>
						</ul>
					</div>
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">12.3. Effects of Termination</h3>
						<p className="text-sm mb-2">Upon termination, the Vendor shall:</p>
						<ul className="text-sm space-y-1 list-[lower-roman] pl-5">
							<li>Immediately cease all use of the Platform and remove all unsold Products.</li>
							<li>Promptly fulfill all outstanding and confirmed orders.</li>
							<li>Settle any and all amounts owed to Stitches Africa within seven (7) days.</li>
							<li>The obligations under Clauses 9 (IP), 10 (Confidentiality/Data), 11 (Indemnity/Liability), and 13 (Governing Law/Dispute) shall survive termination.</li>
						</ul>
					</div>
				</div>
			</section>

			<section>
				<h2 className="text-lg font-bold text-gray-900 mb-3">13. GOVERNING LAW AND DISPUTE RESOLUTION</h2>
				<div className="space-y-3">
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">13.1. Governing Law</h3>
						<p className="text-sm leading-relaxed">
							This Agreement shall be governed by, construed, and enforced in accordance with the laws of the Federal Republic of Nigeria.
						</p>
					</div>
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">13.2. Dispute Resolution</h3>
						<ul className="text-sm space-y-2 list-[lower-alpha] pl-5">
							<li><strong>Negotiation:</strong> The Parties shall first attempt to resolve any dispute arising from this Agreement amicably through good-faith negotiation within fourteen (14) days.</li>
							<li><strong>Arbitration:</strong> Failing amicable resolution, the dispute shall be submitted to binding arbitration in Lagos, Nigeria, in accordance with the provisions of the Arbitration and Mediation Act 2023. The arbitration shall be conducted by a single arbitrator appointed by the Parties.</li>
						</ul>
					</div>
				</div>
			</section>

			<section>
				<h2 className="text-lg font-bold text-gray-900 mb-3">14. GENERAL PROVISIONS</h2>
				<div className="space-y-3">
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">14.1. Notices</h3>
						<p className="text-sm leading-relaxed">
							All notices under this Agreement shall be in writing and deemed sufficiently given if delivered by hand, registered mail, or professional courier to the registered addresses first set out above, or by email with a mandatory delivery/read receipt.
						</p>
					</div>
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">14.2. Entire Agreement and Amendment</h3>
						<p className="text-sm leading-relaxed">
							This Agreement, including all referenced Policies, constitutes the entire understanding between the Parties and supersedes all prior discussions or agreements, oral or written. No amendment shall be effective unless made in writing and signed by an authorized representative of both Parties.
						</p>
					</div>
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">14.3. Severability</h3>
						<p className="text-sm leading-relaxed">
							If any provision of this Agreement is held by a court of competent jurisdiction to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.
						</p>
					</div>
					<div>
						<h3 className="font-semibold text-gray-900 mb-2">14.4. Relationship of Parties</h3>
						<p className="text-sm leading-relaxed">
							The Vendor is an independent contractor. Nothing in this Agreement shall be construed as establishing a partnership, joint venture, employment, or agency relationship between the Parties. Neither Party has the authority to bind the other in any manner.
						</p>
					</div>
				</div>
			</section>

			{showAcceptanceNotice && (
				<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
					<div className="flex items-start gap-3">
						<CheckCircle2 className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
						<div className="text-sm text-amber-900">
							<p className="font-semibold mb-1">
								By clicking &quot;Accept Agreement&quot;, you accept this Vendor Platform Agreement electronically.
							</p>
							<ul className="space-y-1 list-disc pl-5">
								<li>You have reviewed the full agreement.</li>
								<li>You agree to be bound by all terms and conditions.</li>
							</ul>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
