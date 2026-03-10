import { Smartphone, Users, Palette, Star } from "lucide-react";

export default function FeaturesSection() {
	return (
		<section className="py-20 bg-gray-50 mt-10">
			<div className="max-w-6xl mx-auto px-8">
				{/* Header */}
				<div className="text-center mb-16">
					<h2 className="text-4xl font-extrabold text-gray-900 mb-4">
						Why Choose <span className="text-yellow-500">Stitches Africa?</span>
					</h2>
					<p className="text-gray-600 text-lg max-w-2xl mx-auto">
						Join thousands of fashion enthusiasts discovering authentic African
						style and connecting with a vibrant community of designers and
						fashion lovers.
					</p>
				</div>

				{/* Feature Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
					{[
						{
							icon: <Palette className="w-8 h-8 text-white" />,
							bg: "from-orange-500 to-red-500",
							title: "Authentic Designs",
							desc: "Discover genuine African fashion pieces from talented designers across the continent.",
						},
						{
							icon: <Users className="w-8 h-8 text-white" />,
							bg: "from-blue-500 to-indigo-500",
							title: "Fashion Community",
							desc: "Connect with like-minded fashion enthusiasts and share your unique style journey.",
						},
						{
							icon: <Smartphone className="w-8 h-8 text-white" />,
							bg: "from-green-500 to-emerald-500",
							title: "Mobile First",
							desc: "Access your fashion community anywhere with our beautifully designed mobile app.",
						},
						{
							icon: <Star className="w-8 h-8 text-white" />,
							bg: "from-purple-500 to-pink-500",
							title: "Premium Quality",
							desc: "Every piece is carefully curated to ensure the highest quality and authenticity.",
						},
					].map((item, idx) => (
						<div
							key={idx}
							className="bg-white rounded-2xl shadow-md hover:shadow-xl transition transform hover:-translate-y-2 p-8 text-center"
						>
							{/* Icon */}
							<div
								className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${item.bg} flex items-center justify-center mb-6 shadow-lg`}
							>
								{item.icon}
							</div>

							{/* Title */}
							<h3 className="text-xl font-semibold text-gray-900 mb-3">
								{item.title}
							</h3>

							{/* Description */}
							<p className="text-gray-600">{item.desc}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

export default memo(FeaturesSection);
