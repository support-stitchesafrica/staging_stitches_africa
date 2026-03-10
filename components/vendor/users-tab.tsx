"use client";

import { useState } from "react";
import { Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import
{
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import
{
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import
{
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface User
{
  id: string;
  address: string;
  bio: string;
  createdAt: string; // ISO date string
  dateOfBirth: string; // YYYY-MM-DD
  email: string;
  first_name: string;
  gender: string;
  imageUrl: string;
  is_sub_tailor: boolean;
  is_tailor: boolean;
  languagesSpoken: string[];
  last_name: string;
  localGovernmentArea: string;
  nationality: string;
  phoneNumber: string;
  role: string; // "initiator" | "verifier"
  skillSpecialties: string[];
  stateOfOrigin: string;
  tailorId: string;
  yearsOfExperience: number;
}

interface UsersTabProps
{
  users: User[];
}

export function UsersTab({ users }: UsersTabProps)
{
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filteredUsers = users.filter(
    (user) =>
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) =>
  {
    switch (role.toLowerCase())
    {
      case "initiator":
        return (
          <Badge className="bg-blue-100 text-blue-800">Initiator</Badge>
        );
      case "verifier":
        return (
          <Badge className="bg-purple-100 text-purple-800">Verifier</Badge>
        );
      default:
        return <Badge>{role}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>
          All users associated with this vendor
        </CardDescription>
        <div className="flex items-center space-x-2 mt-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>
                    {user.first_name} {user.last_name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Eye className="w-4 h-4 mr-1" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Dialog for showing user details */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              {selectedUser.imageUrl && (
                <img
                  src={selectedUser.imageUrl}
                  alt={`${selectedUser.first_name || ""} ${selectedUser.last_name || ""}`}
                  className="w-24 h-24 rounded-full object-cover"
                />
              )}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="font-semibold">Name</p>
                  <p>{`${selectedUser.first_name || ""} ${selectedUser.last_name || ""}`.trim() || "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold">Email</p>
                  <p>{selectedUser.email || "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold">Address</p>
                  <p>{selectedUser.address || "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold">Bio</p>
                  <p>{selectedUser.bio || "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold">Date of Birth</p>
                  <p>{selectedUser.dateOfBirth || "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold">Gender</p>
                  <p>{selectedUser.gender || "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold">Languages</p>
                  <p>{selectedUser.languagesSpoken?.length ? selectedUser.languagesSpoken.join(", ") : "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold">Skills</p>
                  <p>{selectedUser.skillSpecialties?.length ? selectedUser.skillSpecialties.join(", ") : "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold">Phone</p>
                  <p>{selectedUser.phoneNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold">Role</p>
                  <p>{selectedUser.role || "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold">State of Origin</p>
                  <p>{selectedUser.stateOfOrigin || "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold">Nationality</p>
                  <p>{selectedUser.nationality || "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold">LGA</p>
                  <p>{selectedUser.localGovernmentArea || "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold">Experience</p>
                  <p>{selectedUser.yearsOfExperience ?? "N/A"} years</p>
                </div>
                <div>
                  <p className="font-semibold">Tailor ID</p>
                  <p>{selectedUser.tailorId || "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold">Is Tailor</p>
                  <p>{selectedUser.is_tailor ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="font-semibold">Is Sub Tailor</p>
                  <p>{selectedUser.is_sub_tailor ? "Yes" : "No"}</p>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
