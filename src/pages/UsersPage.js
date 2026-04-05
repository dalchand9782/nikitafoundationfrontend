import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser, formatApiError } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Users,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Eye,
  EyeOff
} from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    role: 'collector'
  });
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateDialog = () => {
    setSelectedUser(null);
    setFormData({ name: '', email: '', mobile: '', password: '', role: 'collector' });
    setDialogOpen(true);
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      mobile: user.mobile || '',
      password: '',
      role: user.role
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    if (!selectedUser && !formData.password) {
      toast.error('Password is required for new users');
      return;
    }

    setFormLoading(true);
    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, formData);
        toast.success('User updated successfully');
      } else {
        await createUser(formData);
        toast.success('User created successfully');
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    setFormLoading(true);
    try {
      await deleteUser(selectedUser.id);
      toast.success('User deleted successfully');
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await updateUser(user.id, { is_active: !user.is_active });
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-stone-800">
            User Management
          </h1>
          <p className="text-stone-500 mt-1">Manage admin and collector accounts</p>
        </div>
        <Button 
          onClick={openCreateDialog}
          className="bg-forest-500 hover:bg-forest-600" 
          data-testid="create-user-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Users List */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-forest-600" />
            All Users
            <Badge variant="secondary" className="ml-2">{users.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-stone-100 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              <Users className="h-16 w-16 mx-auto mb-4 text-stone-300" />
              <p className="text-lg font-medium">No users yet</p>
              <p className="text-sm mt-1">Create your first user to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div 
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-stone-50 gap-3"
                  data-testid={`user-item-${user.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      user.role === 'admin' ? 'bg-terracotta-100' : 'bg-forest-100'
                    }`}>
                      <span className={`font-semibold ${
                        user.role === 'admin' ? 'text-terracotta-600' : 'text-forest-600'
                      }`}>
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-stone-800">{user.name}</p>
                        <Badge 
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                          className={user.role === 'admin' ? 'bg-terracotta-500' : 'bg-forest-100 text-forest-700'}
                        >
                          {user.role}
                        </Badge>
                        {!user.is_active && (
                          <Badge variant="destructive" className="bg-red-100 text-red-700">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-stone-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-auto sm:ml-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(user)}
                      className={user.is_active ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}
                      data-testid={`toggle-user-${user.id}`}
                    >
                      {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(user)}
                      className="text-forest-600 hover:text-forest-700"
                      data-testid={`edit-user-${user.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(user)}
                      className="text-red-600 hover:text-red-700"
                      data-testid={`delete-user-${user.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">
              {selectedUser ? 'Edit User' : 'Create New User'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
                data-testid="user-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email"
                disabled={!!selectedUser}
                data-testid="user-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="Enter mobile number"
                data-testid="user-mobile-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {selectedUser && '(leave blank to keep current)'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={selectedUser ? 'Enter new password' : 'Enter password'}
                  className="pr-10"
                  data-testid="user-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger data-testid="user-role-select">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="collector">Collector</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={formLoading}
                className="bg-forest-500 hover:bg-forest-600"
                data-testid="save-user-button"
              >
                {formLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  selectedUser ? 'Update User' : 'Create User'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user "{selectedUser?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
              data-testid="confirm-delete-user"
            >
              {formLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
