import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export const AppDownloadSection = () => {
	const { t } = useLanguage();

	return (
		<section className="py-12 md:py-16 bg-gradient-to-br from-gray-50 to-white">
			<div className="container mx-auto px-4">
				<div className="max-w-4xl mx-auto text-center">
					<h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
						{t.download.title}
					</h2>
					<p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
						{t.download.subtitle}
					</p>

					{/* App Download Buttons */}
					<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
						<Button
							variant="outline"
							onClick={(e) => {
								e.preventDefault();
								window.open(
									"https://apps.apple.com/app/stitches-africa/id6753875161",
									"_blank",
									"noopener",
								);
							}}
							className="flex items-center bg-black text-white space-x-3 px-6 py-6 border-2 border-black hover:bg-gray-800 transition-colors min-w-[200px]"
						>
							<Image
								src="/images/apple-logo.png"
								alt="Apple Store"
								width={24}
								height={24}
								className="w-6 h-6"
							/>
							<div className="text-left">
								<div className="text-xs">{t.download.downloadOn}</div>
								<div className="text-sm font-semibold">
									{t.download.appleStore}
								</div>
							</div>
						</Button>
						<Button
							variant="outline"
							onClick={(e) => {
								e.preventDefault();
								window.open(
									"https://play.google.com/store/apps/details?id=com.stitchesAfricaLimited.app&pcampaignid=web_share",
									"_blank",
									"noopener",
								);
							}}
							className="flex items-center bg-black text-white space-x-3 px-6 py-6 border-2 border-black hover:bg-gray-800 transition-colors min-w-[200px]"
						>
							<Image
								src="/images/playstore-log.png"
								alt="Google Play Store"
								width={24}
								height={24}
								className="w-6 h-6"
							/>
							<div className="text-left">
								<div className="text-xs">{t.download.getItOn}</div>
								<div className="text-sm font-semibold">
									{t.download.googlePlay}
								</div>
							</div>
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
};
