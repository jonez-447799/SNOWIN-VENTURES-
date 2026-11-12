/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { PLATFORM_DEMO_PLANTS } from './commercial/PlatformTopBar';
import type { PlantId } from './context/PlantContext';

// Initialize Firebase App, Firestore (with explicit databaseId), and Auth
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIRESTORE_DATABASE_ID = firebaseConfig.firestoreDatabaseId;

// ============================================================================
// VALIDATION CONSTANTS SYNCHRONIZED VERBATIM WITH firebase-blueprint.json
// ============================================================================
export const VALID_ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
export const MAX_ID_LENGTH = 128;
export const MAX_LEAD_ID_LENGTH = 64;
export const MAX_NOTE_ID_LENGTH = 64;
export const MAX_DISPLAY_NAME_LENGTH = 120;
export const MAX_COMPANY_NAME_LENGTH = 160;
export const MAX_PLANT_LOCATION_LENGTH = 160;
export const MAX_ERP_SYSTEM_LENGTH = 120;
export const MAX_EMAIL_LENGTH = 180;
export const MAX_PHONE_LENGTH = 40;
export const MAX_ROLE_LENGTH = 32;
export const MAX_STATUS_LENGTH = 32;
export const MAX_SUMMARY_TEXT_LENGTH = 500;

export const ALLOWED_USER_ROLES = ['owner', 'ops_head', 'auditor', 'viewer'] as const;
export type AllowedUserRole = (typeof ALLOWED_USER_ROLES)[number];

export const ALLOWED_PILOT_STATUSES = [
  'NEW',
  'SUITABILITY_REVIEW',
  'NDA_SENT',
  'APPROVED_FOR_UPLOAD',
  'CLOSED',
] as const;
export type AllowedPilotStatus = (typeof ALLOWED_PILOT_STATUSES)[number];

export const ALLOWED_PLANT_IDS = ['ambattur', 'sriperumbudur', 'hosur'] as const;
export const ALLOWED_WORKSPACE_STATUSES = ['ACTIVE', 'LOCKED_FINAL'] as const;
export const ALLOWED_NOTE_PILLARS = [
  'P1_INVENTORY',
  'P2_OTIF',
  'P3_FREIGHT',
  'P4_WAREHOUSE',
  'EXECUTIVE',
] as const;
export const ALLOWED_NOTE_STATUSES = ['OPEN', 'IN_REVIEW', 'RESOLVED'] as const;

// ============================================================================
// STANDARDIZED FIRESTORE ERROR HANDLER (REQUIRED BY SKILL)
// ============================================================================
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ============================================================================
// VALIDATE CONNECTION TO FIRESTORE ON BOOT
// ============================================================================
let connectionTested = false;
export async function testConnection(): Promise<'connected' | 'offline'> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return 'connected';
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return 'offline';
    }
    // A permission-denied response from the server confirms Firestore is reachable and online
    return 'connected';
  }
}

if (typeof window !== 'undefined' && !connectionTested) {
  connectionTested = true;
  void testConnection();
}

// ============================================================================
// DEFENSIVE PAYLOAD SANITIZATION & STRUCTURAL VALIDATORS
// ============================================================================
export function sanitizeDocumentId(rawId: string, maxLen: number = MAX_ID_LENGTH): string {
  const cleaned = String(rawId || '')
    .trim()
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, maxLen);
  return cleaned.length >= 2 ? cleaned : `doc_${Date.now()}`;
}

export function clampString(val: unknown, minLen: number, maxLen: number, fallback: string): string {
  const trimmed = String(val ?? '').trim();
  const effective = trimmed.length >= minLen ? trimmed : fallback;
  return effective.slice(0, maxLen);
}

export function clampNumber(val: unknown, min: number, max: number, fallback: number): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

export interface UserPublicProfileData {
  uid: string;
  displayName: string;
  companyName: string;
  role: AllowedUserRole;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserPrivateInfoData {
  uid: string;
  email: string;
  phoneOrWhatsapp?: string;
  plantLocation?: string;
  updatedAt?: unknown;
}

export interface PilotRequestFirestoreData {
  leadId: string;
  ownerId: string;
  fullName: string;
  companyName: string;
  plantLocation: string;
  erpSystem: string;
  status: AllowedPilotStatus;
  diagnosticScore: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PlantWorkspaceCloudSnapshotData {
  workspaceId: string;
  ownerId: string;
  plantId: PlantId;
  plantName: string;
  skuCount: number;
  totalStockValueInr: number;
  nonMovingValueInr: number;
  otifPercent: number;
  freightLeakInr: number;
  binMatchPercent: number;
  status: 'ACTIVE' | 'LOCKED_FINAL';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export function sanitizeUserPublicProfileInput(input: {
  uid: string;
  displayName?: string | null;
  companyName?: string | null;
  role?: string | null;
}): Omit<UserPublicProfileData, 'createdAt' | 'updatedAt'> {
  const uid = sanitizeDocumentId(input.uid, MAX_ID_LENGTH);
  const displayName = clampString(
    input.displayName,
    1,
    MAX_DISPLAY_NAME_LENGTH,
    'Operations Executive'
  );
  const companyName = clampString(
    input.companyName,
    1,
    MAX_COMPANY_NAME_LENGTH,
    'Ambattur Manufacturing Unit'
  );
  const role: AllowedUserRole = ALLOWED_USER_ROLES.includes(input.role as AllowedUserRole)
    ? (input.role as AllowedUserRole)
    : 'owner';

  return {
    uid,
    displayName,
    companyName,
    role,
  };
}

export function sanitizeUserPrivateInfoInput(input: {
  uid: string;
  email?: string | null;
  phoneOrWhatsapp?: string | null;
  plantLocation?: string | null;
}): Omit<UserPrivateInfoData, 'updatedAt'> {
  const uid = sanitizeDocumentId(input.uid, MAX_ID_LENGTH);
  const email = clampString(
    input.email,
    3,
    MAX_EMAIL_LENGTH,
    'executive@operationalyst.in'
  );
  const phoneOrWhatsapp = String(input.phoneOrWhatsapp ?? '')
    .trim()
    .slice(0, MAX_PHONE_LENGTH);
  const plantLocation = String(input.plantLocation ?? '')
    .trim()
    .slice(0, MAX_PLANT_LOCATION_LENGTH);

  return {
    uid,
    email,
    phoneOrWhatsapp,
    plantLocation,
  };
}

export function sanitizePilotRequestInput(input: {
  leadId: string;
  ownerId: string;
  fullName: string;
  companyName: string;
  plantLocation?: string;
  erpSystem?: string;
  diagnosticScore?: number;
}): Omit<PilotRequestFirestoreData, 'createdAt' | 'updatedAt'> {
  const leadId = sanitizeDocumentId(input.leadId, MAX_LEAD_ID_LENGTH);
  const ownerId = sanitizeDocumentId(input.ownerId, MAX_ID_LENGTH);
  const fullName = clampString(input.fullName, 2, MAX_DISPLAY_NAME_LENGTH, 'Plant Executive');
  const companyName = clampString(
    input.companyName,
    2,
    MAX_COMPANY_NAME_LENGTH,
    'Manufacturing Unit'
  );
  const plantLocation = clampString(
    input.plantLocation,
    2,
    MAX_PLANT_LOCATION_LENGTH,
    'Chennai Industrial Cluster'
  );
  const erpSystem = clampString(
    input.erpSystem,
    1,
    MAX_ERP_SYSTEM_LENGTH,
    'Tally Prime / Excel'
  );
  const diagnosticScore = clampNumber(input.diagnosticScore, 0, 100, 72);

  return {
    leadId,
    ownerId,
    fullName,
    companyName,
    plantLocation,
    erpSystem,
    status: 'NEW',
    diagnosticScore,
  };
}

export function sanitizePlantWorkspaceInput(input: {
  ownerId: string;
  plantId: PlantId;
  customMetrics?: Partial<{
    plantName: string;
    skuCount: number;
    totalStockValueInr: number;
    nonMovingValueInr: number;
    otifPercent: number;
    freightLeakInr: number;
    binMatchPercent: number;
  }>;
}): Omit<PlantWorkspaceCloudSnapshotData, 'createdAt' | 'updatedAt'> {
  const ownerId = sanitizeDocumentId(input.ownerId, MAX_ID_LENGTH);
  const safePlantId: PlantId = ALLOWED_PLANT_IDS.includes(input.plantId)
    ? input.plantId
    : 'ambattur';
  const preset = PLATFORM_DEMO_PLANTS[safePlantId] || PLATFORM_DEMO_PLANTS.ambattur;
  const workspaceId = sanitizeDocumentId(`${ownerId}_${safePlantId}`, MAX_ID_LENGTH);

  return {
    workspaceId,
    ownerId,
    plantId: safePlantId,
    plantName: clampString(
      input.customMetrics?.plantName ?? preset.name,
      2,
      MAX_COMPANY_NAME_LENGTH,
      preset.name
    ),
    skuCount: clampNumber(input.customMetrics?.skuCount ?? preset.skuCount, 0, 500000, preset.skuCount),
    totalStockValueInr: clampNumber(
      input.customMetrics?.totalStockValueInr ?? preset.totalStockValue,
      0,
      100000000000,
      preset.totalStockValue
    ),
    nonMovingValueInr: clampNumber(
      input.customMetrics?.nonMovingValueInr ?? preset.nonMovingValue,
      0,
      100000000000,
      preset.nonMovingValue
    ),
    otifPercent: clampNumber(
      input.customMetrics?.otifPercent ?? preset.otifPercent,
      0,
      100,
      preset.otifPercent
    ),
    freightLeakInr: clampNumber(
      input.customMetrics?.freightLeakInr ?? preset.freightLeakValue,
      0,
      10000000000,
      preset.freightLeakValue
    ),
    binMatchPercent: clampNumber(
      input.customMetrics?.binMatchPercent ?? preset.binMatchPercent,
      0,
      100,
      preset.binMatchPercent
    ),
    status: 'ACTIVE',
  };
}

// ============================================================================
// AUTHENTICATION & FIRESTORE MUTATION OPERATIONS
// ============================================================================
export async function signInWithGooglePopup(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
  if (credential.user) {
    await upsertUserProfileToFirestore({
      user: credential.user,
      companyName: 'Ambattur Manufacturing Unit',
      role: 'owner',
      plantLocation: 'Chennai, TN',
    });
  }
  return credential.user;
}

export async function signOutFirebaseUser(): Promise<void> {
  await signOut(auth);
}

export async function upsertUserProfileToFirestore(params: {
  user: User;
  companyName?: string;
  role?: AllowedUserRole;
  plantLocation?: string;
  phoneOrWhatsapp?: string;
}): Promise<void> {
  const { user } = params;
  if (!user?.uid) return;

  const publicPath = `users/${user.uid}`;
  const privatePath = `users/${user.uid}/private/info`;

  const sanitizedPublic = sanitizeUserPublicProfileInput({
    uid: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'Operations Reviewer',
    companyName: params.companyName || 'Ambattur Baseline Unit',
    role: params.role || 'owner',
  });

  try {
    const publicRef = doc(db, 'users', user.uid);
    const existingSnap = await getDoc(publicRef);
    if (!existingSnap.exists()) {
      await setDoc(publicRef, {
        ...sanitizedPublic,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(publicRef, {
        displayName: sanitizedPublic.displayName,
        companyName: sanitizedPublic.companyName,
        role: sanitizedPublic.role,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, publicPath);
  }

  if (user.email) {
    const sanitizedPrivate = sanitizeUserPrivateInfoInput({
      uid: user.uid,
      email: user.email,
      phoneOrWhatsapp: params.phoneOrWhatsapp || '',
      plantLocation: params.plantLocation || 'Chennai, TN',
    });

    try {
      const privateRef = doc(db, 'users', user.uid, 'private', 'info');
      const existingPriv = await getDoc(privateRef);
      if (!existingPriv.exists()) {
        await setDoc(privateRef, {
          ...sanitizedPrivate,
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(privateRef, {
          email: sanitizedPrivate.email,
          phoneOrWhatsapp: sanitizedPrivate.phoneOrWhatsapp,
          plantLocation: sanitizedPrivate.plantLocation,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, privatePath);
    }
  }
}

export async function syncPilotLeadToFirestore(input: {
  leadId: string;
  fullName: string;
  companyName: string;
  plantLocation?: string;
  erpSystem?: string;
  diagnosticScore?: number;
}): Promise<boolean> {
  const currentUser = auth.currentUser;
  if (!currentUser?.uid) {
    return false;
  }

  const sanitized = sanitizePilotRequestInput({
    ...input,
    ownerId: currentUser.uid,
  });
  const path = `pilot_requests/${sanitized.leadId}`;

  try {
    const ref = doc(db, 'pilot_requests', sanitized.leadId);
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      await setDoc(ref, {
        ...sanitized,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        fullName: sanitized.fullName,
        companyName: sanitized.companyName,
        plantLocation: sanitized.plantLocation,
        erpSystem: sanitized.erpSystem,
        diagnosticScore: sanitized.diagnosticScore,
        updatedAt: serverTimestamp(),
      });
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncPlantWorkspaceToFirestore(
  plantId: PlantId,
  customMetrics?: Partial<{
    plantName: string;
    skuCount: number;
    totalStockValueInr: number;
    nonMovingValueInr: number;
    otifPercent: number;
    freightLeakInr: number;
    binMatchPercent: number;
  }>
): Promise<PlantWorkspaceCloudSnapshotData> {
  const currentUser = auth.currentUser;
  if (!currentUser?.uid) {
    throw new Error('Authentication required: Sign in with Google to sync plant workspaces to Firestore.');
  }

  const sanitized = sanitizePlantWorkspaceInput({
    ownerId: currentUser.uid,
    plantId,
    customMetrics,
  });
  const path = `plant_workspaces/${sanitized.workspaceId}`;

  try {
    const ref = doc(db, 'plant_workspaces', sanitized.workspaceId);
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      await setDoc(ref, {
        ...sanitized,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        plantName: sanitized.plantName,
        skuCount: sanitized.skuCount,
        totalStockValueInr: sanitized.totalStockValueInr,
        nonMovingValueInr: sanitized.nonMovingValueInr,
        otifPercent: sanitized.otifPercent,
        freightLeakInr: sanitized.freightLeakInr,
        binMatchPercent: sanitized.binMatchPercent,
        updatedAt: serverTimestamp(),
      });
    }
    return sanitized;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePlantWorkspaceFromFirestore(workspaceId: string): Promise<void> {
  const safeId = sanitizeDocumentId(workspaceId, MAX_ID_LENGTH);
  const path = `plant_workspaces/${safeId}`;
  try {
    await deleteDoc(doc(db, 'plant_workspaces', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToUserWorkspaces(
  uid: string,
  onData: (items: PlantWorkspaceCloudSnapshotData[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'plant_workspaces';
  const q = query(collection(db, path), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const records: PlantWorkspaceCloudSnapshotData[] = [];
      snapshot.forEach((docSnap) => {
        records.push(docSnap.data() as PlantWorkspaceCloudSnapshotData);
      });
      onData(records);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (formattedErr) {
        if (onError && formattedErr instanceof Error) {
          onError(formattedErr);
        }
      }
    }
  );
}

export function subscribeToUserPilotRequests(
  uid: string,
  onData: (items: PilotRequestFirestoreData[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'pilot_requests';
  const q = query(collection(db, path), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const records: PilotRequestFirestoreData[] = [];
      snapshot.forEach((docSnap) => {
        records.push(docSnap.data() as PilotRequestFirestoreData);
      });
      onData(records);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (formattedErr) {
        if (onError && formattedErr instanceof Error) {
          onError(formattedErr);
        }
      }
    }
  );
}
