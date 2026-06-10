"use client";

import { useState } from "react";
import {
	doc,
	collection,
	query,
	where,
	getDocs,
	deleteDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { toast } from "sonner";

export default function FixDuplicatesPage() {
	const [userId, setUserId] = useState("p75XaGcay1heVlsVUE58r6Ch3sy1");
	const [orderId, setOrderId] = useState("EJDKW0F");
	const [loading, setLoading] = useState(false);
	const [duplicates, setDuplicates] = useState<any[]>([]);
	const [fetched, setFetched] = useState(false);

	const fetchDuplicates = async () => {
		if (!userId || !orderId) {
			toast.error("Please provide both User ID and Order ID");
			return;
		}

		setLoading(true);
		setDuplicates([]);
		setFetched(false);

		try {
			const ordersRef = collection(db, "users_orders", userId, "user_orders");
			const q = query(ordersRef, where("order_id", "==", orderId));
			const querySnapshot = await getDocs(q);

			const foundOrders: any[] = [];
			querySnapshot.forEach((doc) => {
				foundOrders.push({ id: doc.id, ...doc.data() });
			});

			setDuplicates(foundOrders);
			setFetched(true);

			if (foundOrders.length === 0) {
				toast.info("No orders found with this ID");
			} else if (foundOrders.length === 1) {
				toast.success("Only 1 order found. No duplicates!");
			} else {
				toast.warning(`Found ${foundOrders.length} duplicates!`);
			}
		} catch (error) {
			console.error("Error fetching duplicates:", error);
			toast.error("Failed to fetch duplicates");
		} finally {
			setLoading(false);
		}
	};

	const deleteDuplicates = async () => {
		if (duplicates.length <= 1) {
			toast.error("Nothing to delete (need more than 1 record)");
			return;
		}

		if (
			!confirm(
				`Are you sure you want to delete ${duplicates.length - 1} duplicate orders? This cannot be undone.`,
			)
		) {
			return;
		}

		setLoading(true);

		try {
			// Keep the first one, delete the rest
			const [keep, ...toDelete] = duplicates;

			console.log(`Keeping order document: ${keep.id}`);

			for (const order of toDelete) {
				console.log(`Deleting duplicate order document: ${order.id}`);
				await deleteDoc(
					doc(db, "users_orders", userId, "user_orders", order.id),
				);
			}

			toast.success(
				`Successfully deleted ${toDelete.length} duplicates. Kept ID: ${keep.id}`,
			);

			// Refresh list
			await fetchDuplicates();
		} catch (error) {
			console.error("Error deleting duplicates:", error);
			toast.error("Failed to delete duplicates");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-8 max-w-2xl mx-auto">
			<h1 className="text-2xl font-bold mb-6">Fix Duplicate User Orders</h1>

			<div className="space-y-4 bg-white p-6 rounded-lg shadow border">
				<div>
					<label className="block text-sm font-medium mb-1">User ID</label>
					<input
						type="text"
						value={userId}
						onChange={(e) => setUserId(e.target.value)}
						className="w-full p-2 border rounded"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium mb-1">Order ID</label>
					<input
						type="text"
						value={orderId}
						onChange={(e) => setOrderId(e.target.value)}
						className="w-full p-2 border rounded"
					/>
				</div>

				<div className="pt-4 flex gap-4">
					<button
						onClick={fetchDuplicates}
						disabled={loading}
						className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
					>
						{loading ? "Processing..." : "Fetch Duplicates"}
					</button>

					{fetched && duplicates.length > 1 && (
						<button
							onClick={deleteDuplicates}
							disabled={loading}
							className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
						>
							Delete Duplicates (Keep 1)
						</button>
					)}
				</div>

				{fetched && (
					<div className="mt-6">
						<h3 className="font-semibold mb-2">Results:</h3>
						<p>
							Found <strong>{duplicates.length}</strong> records for Order ID:{" "}
							{orderId}
						</p>

						<ul className="mt-2 space-y-2 max-h-60 overflow-y-auto border p-2 rounded">
							{duplicates.map((order, idx) => (
								<li
									key={order.id}
									className="text-sm p-2 bg-gray-50 rounded flex justify-between items-center"
								>
									<span>
										<span className="font-mono text-xs bg-gray-200 px-1 rounded mr-2">
											{order.id}
										</span>
										{idx === 0 ? (
											<span className="text-green-600 font-bold ml-2">
												(Will Keep)
											</span>
										) : (
											<span className="text-red-500 ml-2">(Will Delete)</span>
										)}
									</span>
									<span className="text-gray-500 text-xs">
										{new Date(
											order.createdAt?.seconds * 1000 || Date.now(),
										).toLocaleString()}
									</span>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}
