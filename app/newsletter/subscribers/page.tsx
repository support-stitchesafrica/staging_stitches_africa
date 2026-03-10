"use client";
import { useEffect, useState, useMemo } from "react";
import { Header } from "@/components/newsletter/dashboard/header";
import { SubscriberTable } from "@/components/newsletter/subscribers/subscriber-table";
import { FolderTable } from "@/components/newsletter/subscribers/folder-table";

import { WaitingListTable } from "@/components/newsletter/subscribers/waitlist-table";
import { AddSubscriberDialog } from "@/components/newsletter/subscribers/add-subscriber-dialog";
import { ImportSubscribersDialog } from "@/components/newsletter/subscribers/import-subscribers-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSubscribers } from "@/lib/hooks/use-firebase";
import { subscriberService, type Subscriber, subCollectService } from "@/lib/firebase/collections";
import { useToast } from "@/hooks/use-toast";
import { Search, Upload, Folder, ChevronLeft, ChevronRight } from "lucide-react";
import { useWaitingList } from "@/lib/hooks/use-waiting-list";
import { format } from "date-fns";

export default function SubscribersPage() {
  const { subscribers, loading, refetch } = useSubscribers();
  const { waitingList, loading: waitingLoading } = useWaitingList();
  const { toast } = useToast();

  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<any | null>(null);
  const [folderSubscribers, setFolderSubscribers] = useState<any[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [loadingFolderSubs, setLoadingFolderSubs] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("subscribers");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // ✅ Fetch folders
  const refreshFolders = async () => {
    setLoadingFolders(true);
    try {
      const data = await subCollectService.getFolders();
      setFolders(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load folders",
        variant: "destructive",
      });
    } finally {
      setLoadingFolders(false);
    }
  };

  useEffect(() => {
    refreshFolders();
  }, []);

  // ✅ Load folder subscribers
  const loadFolderSubscribers = async (folderId: string) => {
    setLoadingFolderSubs(true);
    try {
      const data = await subCollectService.getSubscribers(folderId);
      setFolderSubscribers(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load folder subscribers",
        variant: "destructive",
      });
    } finally {
      setLoadingFolderSubs(false);
    }
  };

  // ✅ Search & Pagination
  const filteredSubscribers = useMemo(
    () =>
      subscribers.filter(
        (s) =>
          s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.firstName?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [subscribers, searchQuery]
  );

  const filteredWaitingList = useMemo(
    () => waitingList.filter((w) => w.email.toLowerCase().includes(searchQuery.toLowerCase())),
    [waitingList, searchQuery]
  );

  const totalPages =
    currentTab === "subscribers"
      ? Math.ceil(filteredSubscribers.length / ITEMS_PER_PAGE)
      : Math.ceil(filteredWaitingList.length / ITEMS_PER_PAGE);

  const paginatedSubscribers = filteredSubscribers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const paginatedWaitingList = filteredWaitingList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // ✅ Delete subscriber
  const handleDeleteSubscriber = async (subscriber: Subscriber) => {
    if (!subscriber.id) return;
    if (!confirm(`Delete ${subscriber.email}?`)) return;
    try {
      await subscriberService.delete(subscriber.id);
      toast({ title: "Deleted", description: "Subscriber removed successfully." });
      refetch();
    } catch {
      toast({ title: "Error", description: "Failed to delete subscriber.", variant: "destructive" });
    }
  };

  // ✅ Delete folder subscriber
  const handleDeleteFolderSubscriber = async (sub: any) => {
    if (!selectedFolder) return;
    if (!confirm(`Delete ${sub.email}?`)) return;
    try {
      await subCollectService.deleteSubscriber(selectedFolder.id, sub.id);
      toast({ title: "Deleted", description: "Subscriber removed from folder successfully." });
      loadFolderSubscribers(selectedFolder.id);
    } catch {
      toast({ title: "Error", description: "Failed to delete subscriber.", variant: "destructive" });
    }
  };

  return (
    <div>
      <Header
        title="Subscribers Management"
        description="Manage newsletter subscribers, folders, and waiting list users."
        action={{ label: "Add Subscriber", onClick: () => setAddDialogOpen(true) }}
      />

      <div className="p-4 sm:p-6">
        <Tabs
          value={currentTab}
          onValueChange={(v) => {
            setCurrentTab(v);
            setCurrentPage(1);
          }}
        >
          <TabsList className="mb-4 flex flex-wrap gap-2">
            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
            <TabsTrigger value="waiting-list">Waiting List</TabsTrigger>
            <TabsTrigger value="folders">Folders</TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={`Search ${currentTab === "folders" ? "folders" : currentTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {currentTab === "subscribers" && (
              <Button variant="outline" onClick={() => setImportDialogOpen(true)} size="sm">
                <Upload className="mr-2 h-4 w-4" /> Import CSV
              </Button>
            )}
          </div>

          {/* Subscribers Tab */}
          <TabsContent value="subscribers">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading subscribers...</div>
            ) : (
              <>
                <SubscriberTable
                  subscribers={paginatedSubscribers}
                  onDelete={handleDeleteSubscriber}
                  onUnsubscribe={() => {}}
                  selectedSubscribers={selectedSubscribers}
                  onSelectSubscriber={() => {}}
                  onSelectAll={() => {}}
                />
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Waiting List */}
          <TabsContent value="waiting-list">
            {waitingLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading waiting list...</div>
            ) : (
              <>
                <WaitingListTable
                  waitingList={paginatedWaitingList}
                  onDelete={() => {}}
                  selectedEntries={[]}
                  onSelectEntry={() => {}}
                  onSelectAll={() => {}}
                />
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Folders */}
          <TabsContent value="folders">
            {loadingFolders ? (
              <div className="text-center py-8 text-muted-foreground">Loading folders...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {folders.map((folder) => (
                  <Card
                    key={folder.id}
                    className={`cursor-pointer transition hover:border-primary ${
                      selectedFolder?.id === folder.id ? "border-primary" : ""
                    }`}
                    onClick={() => {
                      setSelectedFolder(folder);
                      loadFolderSubscribers(folder.id);
                    }}
                  >
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Folder className="h-4 w-4 text-blue-500" />
                        {folder.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground space-y-1">
                      <p>{folder.description || "No description"}</p>
                      <p className="text-[11px] text-gray-500">
                        Created:{" "}
                        {folder.createdAt?.toDate
                          ? format(folder.createdAt.toDate(), "MMM d, yyyy")
                          : "N/A"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {selectedFolder && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">
                  Subscribers in “{selectedFolder.name}”
                </h3>
                {loadingFolderSubs ? (
                  <div className="text-center py-8 text-muted-foreground">Loading subscribers...</div>
                ) : (
                  <FolderTable
                    subscribers={folderSubscribers}
                    onDelete={handleDeleteFolderSubscriber}
                    onUnsubscribe={() => {}}
                    selectedSubscribers={[]}
                    onSelectSubscriber={() => {}}
                    onSelectAll={() => {}}
                  />
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <AddSubscriberDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => {
          refetch();
          refreshFolders();
        }}
      />
      <ImportSubscribersDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={() => {
          refetch();
          refreshFolders();
        }}
      />
    </div>
  );
}
