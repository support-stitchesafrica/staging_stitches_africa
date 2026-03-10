import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<div className="border-b border-border bg-card">
				<div className="flex h-16 items-center px-4 sm:px-6">
					<Link href="/">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-5 w-5" />
						</Button>
					</Link>
					<h1 className="ml-4 font-serif text-lg font-medium">
						Privacy Policy
					</h1>
				</div>
			</div>

			{/* Privacy Policy Content */}
			<div className="mx-auto max-w-4xl p-6 sm:p-8">
				<div className="space-y-6">
					{/* Logo */}
					<div className="flex justify-center mb-4">
						<img
							src="/Stitches-Africa-Logo-06.png"
							alt="Stitches Afrika Corp Logo"
							className="h-32 w-auto"
						/>
					</div>

					<div className="prose prose-sm max-w-none">
						<p className="text-sm text-muted-foreground">
							<strong>Effective Date:</strong> 23rd July 2025
						</p>

						<section className="mt-6">
							<h3 className="text-lg font-semibold mb-2">
								1. Information We Collect
							</h3>
							<p className="text-sm text-muted-foreground">
								We may collect the following types of information: Personal
								Information including your name, email address, phone number,
								mailing address, date of birth, identification documents, and
								payment details. We also collect Usage Data such as how you
								access and use our services (IP address, browser type, device
								ID, pages visited), and Cookies & Tracking Technologies to
								improve user experience and analyze usage patterns.
							</p>
						</section>

						<section className="mt-6">
							<h3 className="text-lg font-semibold mb-2">
								2. How We Use Your Information
							</h3>
							<p className="text-sm text-muted-foreground">
								We use the information we collect to provide and manage our
								services, communicate with you (updates, security alerts),
								process transactions, personalize and improve user experience,
								and comply with legal obligations.
							</p>
						</section>

						<section className="mt-6">
							<h3 className="text-lg font-semibold mb-2">
								3. Sharing Your Information
							</h3>
							<p className="text-sm text-muted-foreground">
								We do not sell your personal information. We may share your data
								with service providers who help us operate our services, legal
								authorities when required, or in case of a business transfer
								such as a merger or acquisition.
							</p>
						</section>

						<section className="mt-6">
							<h3 className="text-lg font-semibold mb-2">4. Data Security</h3>
							<p className="text-sm text-muted-foreground">
								We implement reasonable technical and organizational measures to
								protect your personal information from unauthorized access,
								alteration, disclosure, or destruction.
							</p>
						</section>

						<section className="mt-6">
							<h3 className="text-lg font-semibold mb-2">5. Your Rights</h3>
							<p className="text-sm text-muted-foreground">
								Depending on your jurisdiction, you may have the right to
								access, correct, or delete your personal information, withdraw
								consent, object to or restrict certain processing, and lodge a
								complaint with a data protection authority.
							</p>
						</section>

						<section className="mt-6">
							<h3 className="text-lg font-semibold mb-2">
								6. Retention of Information
							</h3>
							<p className="text-sm text-muted-foreground">
								We retain your personal data only for as long as necessary to
								fulfill the purposes outlined in this Privacy Policy or as
								required by law.
							</p>
						</section>

						<section className="mt-6">
							<h3 className="text-lg font-semibold mb-2">
								7. Children's Privacy
							</h3>
							<p className="text-sm text-muted-foreground">
								Our services are not intended for individuals under the age of
								18. We do not knowingly collect data from minors.
							</p>
						</section>

						<section className="mt-6">
							<h3 className="text-lg font-semibold mb-2">
								8. Third-Party Links
							</h3>
							<p className="text-sm text-muted-foreground">
								Our platform may contain links to third-party sites. We are not
								responsible for the privacy practices or content of those
								websites.
							</p>
						</section>

						<section className="mt-6">
							<h3 className="text-lg font-semibold mb-2">
								9. Changes to This Policy
							</h3>
							<p className="text-sm text-muted-foreground">
								We may update this Privacy Policy from time to time. Any changes
								will be posted on this page with an updated effective date.
							</p>
						</section>

						<section className="mt-6">
							<h3 className="text-lg font-semibold mb-2">10. Contact Us</h3>
							<p className="text-sm text-muted-foreground">
								If you have any questions about this Privacy Policy or wish to
								exercise your rights, please contact us at:
							</p>
							<div className="mt-2 text-sm text-muted-foreground">
								<p className="font-semibold">STITCHES AFRICA LIMITED</p>
								<p>
									Email:{" "}
									<a
										href="mailto:info@stitchesafrica.com"
										className="text-primary hover:underline"
									>
										info@stitchesafrica.com
									</a>
								</p>
							</div>
						</section>
					</div>
				</div>
			</div>
		</div>
	);
}
