import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, MessageCircle, FileQuestion } from "lucide-react";

export default function SupportPage() {
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
					<h1 className="ml-4 font-serif text-lg font-medium">Support</h1>
				</div>
			</div>

			{/* Support Content */}
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

					{/* Welcome Section */}
					<div className="text-center space-y-2">
						<h2 className="text-2xl font-bold">How Can We Help You?</h2>
						<p className="text-muted-foreground">
							We're here to assist you with any questions or concerns about
							Stitches Africa
						</p>
					</div>

					{/* Contact Card */}
					<Card>
						<CardHeader>
							<CardTitle className="font-serif flex items-center gap-2">
								<Mail className="h-5 w-5" />
								Contact Support
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-sm text-muted-foreground">
								For any inquiries, technical issues, or assistance, please reach
								out to our support team:
							</p>
							<div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
								<Mail className="h-6 w-6 text-primary" />
								<div>
									<p className="text-sm font-medium">Email Support</p>
									<a
										href="mailto:support@stitchesafrica.com"
										className="text-lg font-semibold text-primary hover:underline"
									>
										support@stitchesafrica.com
									</a>
								</div>
							</div>
							<p className="text-xs text-muted-foreground">
								We typically respond within 24-48 hours during business days.
							</p>
						</CardContent>
					</Card>

					{/* FAQs Card */}
					<Card>
						<CardHeader>
							<CardTitle className="font-serif flex items-center gap-2">
								<FileQuestion className="h-5 w-5" />
								Frequently Asked Questions
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-3">
								<div>
									<h4 className="font-medium text-sm mb-1">
										How do I create a vendor account?
									</h4>
									<p className="text-sm text-muted-foreground">
										Visit the vendor signup page and complete the registration
										form with your brand details, including brand name, logo,
										contact information, and business type.
									</p>
								</div>

								<div>
									<h4 className="font-medium text-sm mb-1">
										What payment methods do you accept?
									</h4>
									<p className="text-sm text-muted-foreground">
										We accept various payment methods including credit cards,
										debit cards, and mobile money. Specific options may vary by
										region.
									</p>
								</div>

								<div>
									<h4 className="font-medium text-sm mb-1">
										How can I update my brand information?
									</h4>
									<p className="text-sm text-muted-foreground">
										Log into your vendor dashboard and navigate to your profile
										settings to update your brand information, logo, and contact
										details.
									</p>
								</div>

								<div>
									<h4 className="font-medium text-sm mb-1">
										What are your terms and conditions?
									</h4>
									<p className="text-sm text-muted-foreground">
										Please review our{" "}
										<Link
											href="/terms"
											className="text-primary hover:underline"
										>
											Terms & Conditions
										</Link>{" "}
										and{" "}
										<Link
											href="/privacy-policy"
											className="text-primary hover:underline"
										>
											Privacy Policy
										</Link>{" "}
										for detailed information.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Additional Resources */}
					<Card>
						<CardHeader>
							<CardTitle className="font-serif flex items-center gap-2">
								<MessageCircle className="h-5 w-5" />
								Additional Resources
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="text-sm space-y-2">
								<p className="font-medium">Company Information</p>
								<p className="text-muted-foreground">STITCHES AFRICA LIMITED</p>
								<p className="text-muted-foreground">
									General Inquiries:{" "}
									<a
										href="mailto:info@stitchesafrica.com"
										className="text-primary hover:underline"
									>
										info@stitchesafrica.com
									</a>
								</p>
								<p className="text-muted-foreground">
									Technical Support:{" "}
									<a
										href="mailto:support@stitchesafrica.com"
										className="text-primary hover:underline"
									>
										support@stitchesafrica.com
									</a>
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Call to Action */}
					<div className="text-center pt-6">
						<p className="text-sm text-muted-foreground mb-4">
							Can't find what you're looking for?
						</p>
						<Button asChild size="lg">
							<a href="mailto:support@stitchesafrica.com">
								Contact Support Team
							</a>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
