"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserRole } from "@/generated/prisma";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  userType: 'ADMIN' | 'USER';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  creator?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

const ROLE_INFO = {
  ADMIN: {
    label: 'Admin',
    description: 'Manage users, templates, access logs',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    permissions: ['All permissions', 'Manage users', 'Manage templates', 'View access logs']
  },
  EDITOR: {
    label: 'Editor',
    description: 'Upload RFP, edit responses, generate proposals',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    permissions: ['View proposals', 'Download files', 'Upload RFP', 'Edit responses', 'Generate proposals']
  },
  APPROVER: {
    label: 'Approver',
    description: 'Approve drafts, export documents',
    color: 'bg-green-100 text-green-800 border-green-200',
    permissions: ['View proposals', 'Download files', 'Approve drafts', 'Export documents']
  },
  VIEWER: {
    label: 'Viewer',
    description: 'View proposals, download files',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    permissions: ['View proposals', 'Download files']
  }
};

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = params.id as string;
  const isAdmin = session?.user?.userType === 'ADMIN';

  // Fetch user details
  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/users/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setError('Failed to fetch user details');
      }
    } catch (error) {
      setError('Failed to fetch user details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && userId) {
      fetchUser();
    }
  }, [isAdmin, userId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'Never logged in';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return formatDate(dateString);
  };

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600">You don't have permission to view user details.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">User Not Found</h2>
          <p className="text-slate-600 mb-4">{error || 'The requested user could not be found.'}</p>
          <button
            onClick={() => router.push('/users')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  const roleInfo = ROLE_INFO[user.role];

  return (
    <div className="space-y-8 font-lexend">
      {/* Header */}
      <div className="relative">
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl"></div>
        <div className="relative bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.back()}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  User Details
                </h1>
              </div>
              <p className="text-slate-600 font-medium ml-10">View detailed information about this user</p>
              <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full ml-10"></div>
            </div>
          </div>
        </div>
      </div>

      {/* User Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
            
            <div className="p-8">
              <div className="flex items-center space-x-6 mb-8">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl">
                    <span className="text-2xl font-bold text-white">
                      {user.firstName[0]}{user.lastName[0]}
                    </span>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white ${
                    user.isActive ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                </div>

                {/* Basic Info */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-slate-600 mb-2">{user.email}</p>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                    {user.userType === 'ADMIN' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        System Admin
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
                      First Name
                    </label>
                    <p className="text-lg font-semibold text-slate-900">{user.firstName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <p className="text-lg font-semibold text-slate-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
                      Account Created
                    </label>
                    <p className="text-lg font-semibold text-slate-900">{formatDate(user.createdAt)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
                      Last Name
                    </label>
                    <p className="text-lg font-semibold text-slate-900">{user.lastName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
                      User Role
                    </label>
                    <p className="text-lg font-semibold text-slate-900">{roleInfo.label}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
                      Last Login
                    </label>
                    <p className="text-lg font-semibold text-slate-900">{formatLastLogin(user.lastLogin)}</p>
                  </div>
                </div>
              </div>

              {/* Created By */}
              {user.creator && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <label className="block text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
                    Created By
                  </label>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {user.creator.firstName[0]}{user.creator.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {user.creator.firstName} {user.creator.lastName}
                      </p>
                      <p className="text-sm text-slate-600">{user.creator.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Role Information */}
          <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Role Information</h3>
            <div className="space-y-4">
              <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${roleInfo.color}`}>
                {roleInfo.label}
              </div>
              <p className="text-sm text-slate-600">{roleInfo.description}</p>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Permissions:</p>
                <ul className="text-sm text-slate-600 space-y-1">
                  {roleInfo.permissions.map((permission, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

         

          {/* Account Status */}
          <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Account Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Status</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  user.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    user.isActive ? 'bg-green-400' : 'bg-red-400'
                  }`}></span>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">User Type</span>
                <span className="text-sm font-medium text-slate-900">
                  {user.userType === 'ADMIN' ? 'System Admin' : 'Regular User'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Member Since</span>
                <span className="text-sm font-medium text-slate-900">
                  {new Date(user.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short' 
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
