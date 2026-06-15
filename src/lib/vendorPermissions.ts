// Vendor Qualification Role-Based Access Control

import { UserRole } from './simplePermissions';

export type VendorQualificationStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

/**
 * Check if user can view vendor qualifications
 * All authenticated users can view qualifications
 */
export const canViewVendorQualifications = (userRole: UserRole): boolean => {
  return true; // All authenticated users can view
};

/**
 * Check if user can create vendor qualifications
 * Only EDITOR and ADMIN can create
 */
export const canCreateVendorQualification = (userRole: UserRole): boolean => {
  return ['ADMIN', 'EDITOR'].includes(userRole);
};

/**
 * Check if user can edit a vendor qualification
 * - Owner can edit if status is DRAFT
 * - ADMIN can edit any DRAFT
 * - EDITOR can edit their own DRAFT
 */
export const canEditVendorQualification = (
  userRole: UserRole,
  _qualificationOwnerId: string,
  _currentUserId: string,
  status: VendorQualificationStatus
): boolean => {
  // Align with document flow: role-based edit on drafts (no owner check)
  if (status !== 'DRAFT') {
    return false;
  }
  return ['ADMIN', 'EDITOR'].includes(userRole);
};

/**
 * Check if user can delete a vendor qualification
 * - Owner can delete if status is DRAFT
 * - ADMIN can delete any qualification
 */
export const canDeleteVendorQualification = (
  userRole: UserRole,
  _qualificationOwnerId: string,
  _currentUserId: string,
  status: VendorQualificationStatus
): boolean => {
  // Keep deletes limited to drafts; role-based like document flow
  if (status !== 'DRAFT') {
    return false;
  }
  return userRole === 'ADMIN' || userRole === 'EDITOR';
};

/**
 * Check if user can submit a vendor qualification
 * - Owner can submit their own DRAFT
 * - ADMIN can submit any DRAFT
 */
export const canSubmitVendorQualification = (
  userRole: UserRole,
  _qualificationOwnerId: string,
  _currentUserId: string,
  status: VendorQualificationStatus
): boolean => {
  // Role-based submit for drafts (ADMIN/EDITOR), mirroring document flow
  if (status !== 'DRAFT') {
    return false;
  }
  return ['ADMIN', 'EDITOR'].includes(userRole);
};

/**
 * Check if user can approve/reject vendor qualifications
 * Only APPROVER and ADMIN can approve/reject
 */
export const canApproveVendorQualification = (userRole: UserRole): boolean => {
  return ['ADMIN', 'APPROVER'].includes(userRole);
};

/**
 * Check if user can view all qualifications or only their own
 * - ADMIN and APPROVER can view all
 * - Others can only view their own
 */
export const canViewAllVendorQualifications = (userRole: UserRole): boolean => {
  return ['ADMIN', 'APPROVER'].includes(userRole);
};

/**
 * Check if user can review (move to UNDER_REVIEW) qualifications
 * Only APPROVER and ADMIN can review
 */
export const canReviewVendorQualification = (userRole: UserRole): boolean => {
  return ['ADMIN', 'APPROVER'].includes(userRole);
};

/**
 * Get all vendor qualification permissions for a user role
 */
export const getVendorQualificationPermissions = (userRole: UserRole) => {
  return {
    canView: canViewVendorQualifications(userRole),
    canCreate: canCreateVendorQualification(userRole),
    canApprove: canApproveVendorQualification(userRole),
    canReview: canReviewVendorQualification(userRole),
    canViewAll: canViewAllVendorQualifications(userRole),
  };
};

/**
 * Check if user can perform action on qualification
 */
export const checkVendorQualificationPermission = (
  action: 'view' | 'create' | 'edit' | 'delete' | 'submit' | 'approve' | 'review',
  userRole: UserRole,
  qualificationOwnerId?: string,
  currentUserId?: string,
  status?: VendorQualificationStatus
): boolean => {
  switch (action) {
    case 'view':
      return canViewVendorQualifications(userRole);
    case 'create':
      return canCreateVendorQualification(userRole);
    case 'edit':
      if (!status) return false;
      return canEditVendorQualification(userRole, qualificationOwnerId || '', currentUserId || '', status);
    case 'delete':
      if (!status) return false;
      return canDeleteVendorQualification(userRole, qualificationOwnerId || '', currentUserId || '', status);
    case 'submit':
      if (!status) return false;
      return canSubmitVendorQualification(userRole, qualificationOwnerId || '', currentUserId || '', status);
    case 'approve':
      return canApproveVendorQualification(userRole);
    case 'review':
      return canReviewVendorQualification(userRole);
    default:
      return false;
  }
};

























