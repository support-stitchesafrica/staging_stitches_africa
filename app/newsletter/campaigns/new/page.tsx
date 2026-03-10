"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

import
{
	campaignService,
	subscriberService,
	type Template,
	type Subscriber,
} from "@/lib/firebase/collections";
import
{
	getAllWaitingList,
	type WaitingListEntry,
} from "@/lib/firebase/waiting-list";
import { subCollectService } from "@/lib/firebase/collections";
import { TemplateSelector } from "@/components/newsletter/campaigns/template-selector";
import { TemplatePreview } from "@/components/newsletter/templates/template-preview";
import { PreviewModeToggle } from "@/components/newsletter/campaigns/preview-mode-toggle";

export default function NewCampaignPage()
{
	const router = useRouter();
	const { toast } = useToast();

	const [loading, setLoading] = useState(false);
	const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
		null
	);
	const [previewMode, setPreviewMode] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		subject: "",
		previewText: "",
		content: "<p>Start writing your campaign content here...</p>",
	});

	// ✅ Subscribers & Waitlist
	const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
	const [waitlist, setWaitlist] = useState<WaitingListEntry[]>([]);
	const [loadingData, setLoadingData] = useState(true);

	// ✅ Sub Collect
	const [folders, setFolders] = useState<any[]>([]);
	const [folderSubscribers, setFolderSubscribers] = useState<
		Record<string, any[]>
	>({});
	const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
	const [selectedSubCollectSubs, setSelectedSubCollectSubs] = useState<
		string[]
	>([]);

	// ✅ Selection state
	const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
	const [selectedWaitlist, setSelectedWaitlist] = useState<string[]>([]);
	const [tab, setTab] = useState("subscribers");

	// ✅ Fetch all data
	useEffect(() =>
	{
		const fetchData = async () =>
		{
			try
			{
				const [subs, waiters, folderList] = await Promise.all([
					subscriberService.getAll(),
					getAllWaitingList(),
					subCollectService.getFolders(),
				]);

				const activeSubs = subs.filter((s) => s.status === "active");
				setSubscribers(activeSubs);
				setWaitlist(waiters);
				setFolders(folderList);
			} catch (error)
			{
				console.error("Error fetching data:", error);
			} finally
			{
				setLoadingData(false);
			}
		};
		fetchData();
	}, []);

	// ✅ Template selection logic
	const handleTemplateSelect = (template: Template) =>
	{
		setSelectedTemplate(template);
		setPreviewMode(true); // Enable preview mode when template is selected
		let htmlContent = "";

		if (typeof template.content === "string")
		{
			htmlContent = template.content;
		} else if (
			template.content &&
			typeof template.content === "object" &&
			"blocks" in template.content
		)
		{
			const blocks = (template.content as any).blocks || [];
			htmlContent = blocks
				.map((block: any) =>
				{
					const styles = block.styles || {};
					const styleString = Object.entries(styles)
						.map(
							([key, value]) =>
								`${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`
						)
						.join("; ");
					switch (block.type)
					{
						case "heading":
							return `<h2 style="${styleString}">${block.content}</h2>`;
						case "text":
							return `<p style="${styleString}">${block.content}</p>`;
						case "image":
							return `<img src="${block.content}" style="${styleString}" alt="Email image" />`;
						case "button":
							return `<a href="${block.link || "#"
								}" style="display:inline-block;text-decoration:none;${styleString}">${block.content
								}</a>`;
						case "divider":
							return `<hr style="${styleString}" />`;
						case "spacer":
							return `<div style="${styleString}"></div>`;
						default:
							return "";
					}
				})
				.join("\n");
		}

		setFormData({
			...formData,
			name: formData.name || `${template.name} Campaign`,
			content: htmlContent || formData.content,
		});
	};

	// ✅ Toggle folder expansion
	const toggleFolderExpand = async (folderId: string) =>
	{
		if (expandedFolders.includes(folderId))
		{
			setExpandedFolders((prev) => prev.filter((id) => id !== folderId));
		} else
		{
			setExpandedFolders((prev) => [...prev, folderId]);

			if (!folderSubscribers[folderId])
			{
				try
				{
					const subs = await subCollectService.getSubscribers(folderId);
					setFolderSubscribers((prev) => ({ ...prev, [folderId]: subs }));
				} catch (error)
				{
					console.error("Failed to load sub-collect subscribers:", error);
				}
			}
		}
	};

	// ✅ Selection handlers
	const toggleSelection = (id: string, type: "sub" | "wait" | "subcollect") =>
	{
		if (type === "sub")
		{
			setSelectedSubscribers((prev) =>
				prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
			);
		} else if (type === "wait")
		{
			setSelectedWaitlist((prev) =>
				prev.includes(id) ? prev.filter((wid) => wid !== id) : [...prev, id]
			);
		} else
		{
			setSelectedSubCollectSubs((prev) =>
				prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
			);
		}
	};

	// ✅ Select All handlers
	const toggleSelectAllSubscribers = () =>
	{
		if (selectedSubscribers.length === subscribers.length)
		{
			setSelectedSubscribers([]);
		} else
		{
			setSelectedSubscribers(subscribers.map((s) => s.id!));
		}
	};

	const toggleSelectAllWaitlist = () =>
	{
		if (selectedWaitlist.length === waitlist.length)
		{
			setSelectedWaitlist([]);
		} else
		{
			setSelectedWaitlist(waitlist.map((w) => w.id));
		}
	};

	const toggleSelectAllSubCollect = () =>
	{
		const allSubCollectSubs = Object.values(folderSubscribers).flat();
		if (
			selectedSubCollectSubs.length === allSubCollectSubs.length &&
			allSubCollectSubs.length > 0
		)
		{
			setSelectedSubCollectSubs([]);
		} else
		{
			setSelectedSubCollectSubs(allSubCollectSubs.map((s: any) => s.id));
		}
	};

	// ✅ Handle campaign creation
	const handleSubmit = async (e: React.FormEvent) =>
	{
		e.preventDefault();
		setLoading(true);

		try
		{
			const subEmails = subscribers
				.filter((s) => selectedSubscribers.includes(s.id!))
				.map((s) => s.email);

			const waitEmails = waitlist
				.filter((w) => selectedWaitlist.includes(w.id))
				.map((w) => w.email);

			const subCollectEmails = Object.values(folderSubscribers)
				.flat()
				.filter((s: any) => selectedSubCollectSubs.includes(s.id))
				.map((s: any) => s.email);

			const allRecipients = [
				...new Set([...subEmails, ...waitEmails, ...subCollectEmails]),
			];

			if (allRecipients.length === 0)
			{
				toast({
					title: "No recipients selected",
					description: "Please select at least one recipient.",
					variant: "destructive",
				});
				setLoading(false);
				return;
			}

			const id = await campaignService.create({
				...formData,
				status: "draft",
				recipientLists: allRecipients,
				recipientCount: allRecipients.length,
				sentCount: 0,
				openCount: 0,
				clickCount: 0,
				openedBy: [],
				clickedBy: [],
			});

			toast({
				title: "Campaign created",
				description: `Your campaign was created with ${allRecipients.length} recipients.`,
			});

			router.push(`/newsletter/campaigns/${id}`);
		} catch (error)
		{
			console.error(error);
			toast({
				title: "Error",
				description: "Failed to create campaign.",
				variant: "destructive",
			});
		} finally
		{
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<div className="border-b border-border bg-card">
				<div className="flex h-16 items-center px-4 sm:px-6">
					<Link href="/newsletter/campaigns">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-5 w-5" />
						</Button>
					</Link>
					<h1 className="ml-4 font-serif text-lg font-medium">
						Create New Campaign
					</h1>
				</div>
			</div>

			{/* Main Form */}
			<div className="mx-auto max-w-4xl p-4 sm:p-6">
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Campaign Details */}
					<Card>
						<CardHeader>
							<CardTitle className="font-serif">Campaign Details</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<TemplateSelector
								onSelectTemplate={handleTemplateSelect}
								selectedTemplateId={selectedTemplate?.id}
							/>

							<div className="space-y-2">
								<Label htmlFor="name">Campaign Name *</Label>
								<Input
									id="name"
									placeholder="e.g., Spring Collection 2025"
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="subject">Email Subject *</Label>
								<Input
									id="subject"
									placeholder="e.g., Discover Our New Spring Collection"
									value={formData.subject}
									onChange={(e) =>
										setFormData({ ...formData, subject: e.target.value })
									}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="previewText">Preview Text</Label>
								<Input
									id="previewText"
									placeholder="Text shown in email preview"
									value={formData.previewText}
									onChange={(e) =>
										setFormData({ ...formData, previewText: e.target.value })
									}
								/>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label htmlFor="content">Email Content *</Label>
									<PreviewModeToggle
										previewMode={previewMode}
										onToggle={setPreviewMode}
										disabled={!selectedTemplate}
									/>
								</div>

								{previewMode && selectedTemplate ? (
									<TemplatePreview
										template={selectedTemplate}
										content={formData.content}
										className="min-h-[400px]"
									/>
								) : (
									<Textarea
										id="content"
										placeholder="Write your email content here..."
										value={formData.content}
										onChange={(e) =>
											setFormData({ ...formData, content: e.target.value })
										}
										rows={10}
										required
										className="font-mono text-sm"
									/>
								)}

								<p className="text-xs text-muted-foreground">
									{previewMode && selectedTemplate
										? "Preview mode: Switch to Raw HTML to edit the content directly."
										: "You can use HTML for formatting. Select a template above to start with a pre-designed layout."
									}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* ✅ Recipients Section */}
					<Card>
						<CardHeader>
							<CardTitle className="font-serif">Select Recipients</CardTitle>
						</CardHeader>
						<CardContent>
							<Tabs value={tab} onValueChange={setTab}>
								<TabsList className="mb-4">
									<TabsTrigger value="subscribers">Subscribers</TabsTrigger>
									<TabsTrigger value="waitlist">Waitlist</TabsTrigger>
									<TabsTrigger value="subcollect">Sub Collection</TabsTrigger>
								</TabsList>

								{/* Subscribers Tab */}
								<TabsContent value="subscribers">
									{loadingData ? (
										<p>Loading subscribers...</p>
									) : (
										<div className="space-y-3">
											{/* Select All */}
											<div className="flex items-center gap-2 pb-2 border-b">
												<Checkbox
													checked={
														subscribers.length > 0 &&
														selectedSubscribers.length === subscribers.length
													}
													onCheckedChange={toggleSelectAllSubscribers}
												/>
												<Label className="cursor-pointer font-medium text-sm">
													Select All ({selectedSubscribers.length}/
													{subscribers.length})
												</Label>
											</div>

											{/* Subscriber List */}
											<div className="max-h-64 overflow-y-auto border rounded-md p-2 space-y-2">
												{subscribers.map((s) => (
													<div
														key={s.id}
														className="flex items-center justify-between border-b pb-1 last:border-0"
													>
														<div className="flex items-center gap-2">
															<Checkbox
																checked={selectedSubscribers.includes(s.id!)}
																onCheckedChange={() =>
																	toggleSelection(s.id!, "sub")
																}
															/>
															<Label className="cursor-pointer text-sm">
																{s.email}
															</Label>
														</div>
													</div>
												))}
											</div>
										</div>
									)}
								</TabsContent>

								{/* Waitlist Tab */}
								<TabsContent value="waitlist">
									{loadingData ? (
										<p>Loading waitlist...</p>
									) : (
										<div className="space-y-3">
											{/* Select All */}
											<div className="flex items-center gap-2 pb-2 border-b">
												<Checkbox
													checked={
														waitlist.length > 0 &&
														selectedWaitlist.length === waitlist.length
													}
													onCheckedChange={toggleSelectAllWaitlist}
												/>
												<Label className="cursor-pointer font-medium text-sm">
													Select All ({selectedWaitlist.length}/
													{waitlist.length})
												</Label>
											</div>

											{/* Waitlist List */}
											<div className="max-h-64 overflow-y-auto border rounded-md p-2 space-y-2">
												{waitlist.map((w) => (
													<div
														key={w.id}
														className="flex items-center justify-between border-b pb-1 last:border-0"
													>
														<div className="flex items-center gap-2">
															<Checkbox
																checked={selectedWaitlist.includes(w.id)}
																onCheckedChange={() =>
																	toggleSelection(w.id, "wait")
																}
															/>
															<Label className="cursor-pointer text-sm">
																{w.email}
															</Label>
														</div>
														<span className="text-xs text-muted-foreground">
															{w.country !== "Unknown"
																? `${w.city || ""}, ${w.country}`
																: ""}
														</span>
													</div>
												))}
											</div>
										</div>
									)}
								</TabsContent>

								{/* ✅ Sub Collect Tab */}
								<TabsContent value="subcollect">
									{loadingData ? (
										<p>Loading sub-collections...</p>
									) : folders.length === 0 ? (
										<p className="text-sm text-muted-foreground">
											No folders found.
										</p>
									) : (
										<div className="space-y-3">
											{/* Select All */}
											<div className="flex items-center gap-2 pb-2 border-b">
												<Checkbox
													checked={
														Object.values(folderSubscribers).flat().length >
														0 &&
														selectedSubCollectSubs.length ===
														Object.values(folderSubscribers).flat().length
													}
													onCheckedChange={toggleSelectAllSubCollect}
												/>
												<Label className="cursor-pointer font-medium text-sm">
													Select All ({selectedSubCollectSubs.length}/
													{Object.values(folderSubscribers).flat().length})
												</Label>
											</div>

											{/* Folders */}
											<div className="space-y-2">
												{folders.map((folder) => (
													<div key={folder.id} className="border rounded-md">
														<button
															type="button"
															className="flex w-full items-center justify-between px-3 py-2 bg-muted"
															onClick={() => toggleFolderExpand(folder.id)}
														>
															<div className="text-left">
																<p className="font-medium">{folder.name}</p>
																<p className="text-xs text-muted-foreground">
																	{folder.description}
																</p>
															</div>
															{expandedFolders.includes(folder.id) ? (
																<ChevronDown className="h-4 w-4" />
															) : (
																<ChevronRight className="h-4 w-4" />
															)}
														</button>

														{expandedFolders.includes(folder.id) && (
															<div className="max-h-48 overflow-y-auto p-2">
																{folderSubscribers[folder.id]?.length ? (
																	folderSubscribers[folder.id].map((s) => (
																		<div
																			key={s.id}
																			className="flex items-center justify-between border-b pb-1 last:border-0"
																		>
																			<div className="flex items-center gap-2">
																				<Checkbox
																					checked={selectedSubCollectSubs.includes(
																						s.id
																					)}
																					onCheckedChange={() =>
																						toggleSelection(s.id, "subcollect")
																					}
																				/>
																				<Label className="text-sm">
																					{s.email}
																				</Label>
																			</div>
																			<span className="text-xs text-muted-foreground">
																				{s.status || "active"}
																			</span>
																		</div>
																	))
																) : (
																	<p className="text-xs text-muted-foreground px-2">
																		No subscribers in this folder.
																	</p>
																)}
															</div>
														)}
													</div>
												))}
											</div>
										</div>
									)}
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>

					{/* Buttons */}
					<div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.push("/newsletter/campaigns")}
							className="w-full sm:w-auto"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={loading}
							className="w-full sm:w-auto"
						>
							{loading ? "Creating..." : "Create Campaign"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
