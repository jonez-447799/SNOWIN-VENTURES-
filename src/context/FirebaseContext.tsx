/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  auth,
  db,
  FIREBASE_PROJECT_ID,
  FIRESTORE_DATABASE_ID,
  OperationType,
  handleFirestoreError,
  testConnection,
  signInWithGooglePopup,
  signOutFirebaseUser,
  syncPlantWorkspaceToFirestore,
  deletePlantWorkspaceFromFirestore,
  syncPilotLeadToFirestore,
  createWorkspaceAuditNoteInFirestore,
  updateWorkspaceAuditNoteStatusInFirestore,
  subscribeToUserWorkspaces,
  subscribeToUserPilotRequests,
  subscribeToWorkspaceAuditNotes,
  type UserPublicProfileData,
  type UserPrivateInfoData,
  type PlantWorkspaceCloudSnapshotData,
  type PilotRequestFirestoreData,
  type WorkspaceAuditNoteData,
  type NotePillar,
} from '../firebase';
import type { PlantId } from './PlantContext';

export interface FirebaseContextState {
  user: User | null;
  authReady: boolean;
  connectionStatus: 'connecting' | 'connected' | 'offline';
  projectId: string;
  databaseId: string;
  publicProfile: UserPublicProfileData | null;
  privateInfo: UserPrivateInfoData | null;
  syncedWorkspaces: PlantWorkspaceCloudSnapshotData[];
  syncedLeads: PilotRequestFirestoreData[];
  auditNotes: WorkspaceAuditNoteData[];
  lastSyncedAt: string | null;
  syncing: boolean;
  errorMessage: string | null;
  quotaExceededUrl: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  syncActivePlant: (plantId: PlantId) => Promise<boolean>;
  removeSyncedWorkspace: (workspaceId: string) => Promise<boolean>;
  addAuditNote: (params: {
    workspaceId: string;
    pillar: NotePillar;
    summaryText: string;
  }) => Promise<boolean>;
  resolveAuditNote: (params: {
    workspaceId: string;
    noteId: string;
    summaryText: string;
  }) => Promise<boolean>;
  syncLeadRecord: (lead: {
    leadId: string;
    fullName: string;
    companyName: string;
    plantLocation?: string;
    erpSystem?: string;
    diagnosticScore?: number;
  }) => Promise<boolean>;
  clearError: () => void;
}

const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline'>(
    'connecting'
  );
  const [publicProfile, setPublicProfile] = useState<UserPublicProfileData | null>(null);
  const [privateInfo, setPrivateInfo] = useState<UserPrivateInfoData | null>(null);
  const [syncedWorkspaces, setSyncedWorkspaces] = useState<PlantWorkspaceCloudSnapshotData[]>([]);
  const [syncedLeads, setSyncedLeads] = useState<PilotRequestFirestoreData[]>([]);
  const [auditNotes, setAuditNotes] = useState<WorkspaceAuditNoteData[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quotaExceededUrl, setQuotaExceededUrl] = useState<string | null>(null);

  const inspectAndFormatError = useCallback((err: unknown) => {
    const rawMsg = err instanceof Error ? err.message : String(err);
    if (
      rawMsg.includes("Free daily read units per project (free tier database)") ||
      rawMsg.includes('Quota exceeded')
    ) {
      setQuotaExceededUrl(
        `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/firestore/databases/${FIRESTORE_DATABASE_ID}/data?openUpgradeDialog=true`
      );
      setErrorMessage(
        'Daily cloud storage quota reached. Quota resets tomorrow, or you can review plan details in the Firebase Console.'
      );
      return;
    }
    try {
      const parsed = JSON.parse(rawMsg);
      if (parsed && typeof parsed.error === 'string') {
        setErrorMessage(parsed.error);
        return;
      }
    } catch {
      // Plain error message
    }
    setErrorMessage(rawMsg);
  }, []);

  // 1. Validate connection to Firestore on mount
  useEffect(() => {
    let active = true;
    testConnection().then((status) => {
      if (active) {
        setConnectionStatus(status);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // 2. Track Firebase Auth state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (!currentUser) {
        setPublicProfile(null);
        setPrivateInfo(null);
        setSyncedWorkspaces([]);
        setSyncedLeads([]);
        setAuditNotes([]);
      }
    });
    return () => unsubAuth();
  }, []);

  // 3. Attach Firestore onSnapshot listeners ONLY when authReady && user is authenticated
  useEffect(() => {
    if (!authReady || !user?.uid) {
      return;
    }

    const publicPath = `users/${user.uid}`;
    const privatePath = `users/${user.uid}/private/info`;

    const unsubPublic = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          setPublicProfile(snap.data() as UserPublicProfileData);
        }
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, publicPath);
        } catch (formatted) {
          inspectAndFormatError(formatted);
        }
      }
    );

    const unsubPrivate = onSnapshot(
      doc(db, 'users', user.uid, 'private', 'info'),
      (snap) => {
        if (snap.exists()) {
          setPrivateInfo(snap.data() as UserPrivateInfoData);
        }
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, privatePath);
        } catch (formatted) {
          inspectAndFormatError(formatted);
        }
      }
    );

    const unsubWorkspaces = subscribeToUserWorkspaces(
      user.uid,
      (items) => {
        setSyncedWorkspaces(items);
      },
      (err) => inspectAndFormatError(err)
    );

    const unsubLeads = subscribeToUserPilotRequests(
      user.uid,
      (items) => {
        setSyncedLeads(items);
      },
      (err) => inspectAndFormatError(err)
    );

    return () => {
      unsubPublic();
      unsubPrivate();
      unsubWorkspaces();
      unsubLeads();
    };
  }, [authReady, user?.uid, inspectAndFormatError]);

  // 4. Subscribe to floor audit notes for the primary synced workspace when available
  const primaryWorkspaceId = syncedWorkspaces[0]?.workspaceId || null;
  useEffect(() => {
    if (!authReady || !user?.uid || !primaryWorkspaceId) {
      setAuditNotes([]);
      return;
    }

    const unsubNotes = subscribeToWorkspaceAuditNotes(
      primaryWorkspaceId,
      user.uid,
      (notes) => {
        setAuditNotes(notes);
      },
      (err) => inspectAndFormatError(err)
    );

    return () => unsubNotes();
  }, [authReady, user?.uid, primaryWorkspaceId, inspectAndFormatError]);

  const signInWithGoogle = useCallback(async () => {
    setErrorMessage(null);
    setSyncing(true);
    try {
      await signInWithGooglePopup();
      setLastSyncedAt(new Date().toISOString());
    } catch (err) {
      inspectAndFormatError(err);
    } finally {
      setSyncing(false);
    }
  }, [inspectAndFormatError]);

  const signOutUser = useCallback(async () => {
    setErrorMessage(null);
    try {
      await signOutFirebaseUser();
    } catch (err) {
      inspectAndFormatError(err);
    }
  }, [inspectAndFormatError]);

  const syncActivePlant = useCallback(
    async (plantId: PlantId): Promise<boolean> => {
      setErrorMessage(null);
      setSyncing(true);
      try {
        await syncPlantWorkspaceToFirestore(plantId);
        setLastSyncedAt(new Date().toISOString());
        return true;
      } catch (err) {
        inspectAndFormatError(err);
        return false;
      } finally {
        setSyncing(false);
      }
    },
    [inspectAndFormatError]
  );

  const removeSyncedWorkspace = useCallback(
    async (workspaceId: string): Promise<boolean> => {
      setErrorMessage(null);
      setSyncing(true);
      try {
        await deletePlantWorkspaceFromFirestore(workspaceId);
        setLastSyncedAt(new Date().toISOString());
        return true;
      } catch (err) {
        inspectAndFormatError(err);
        return false;
      } finally {
        setSyncing(false);
      }
    },
    [inspectAndFormatError]
  );

  const addAuditNote = useCallback(
    async (params: {
      workspaceId: string;
      pillar: NotePillar;
      summaryText: string;
    }): Promise<boolean> => {
      setErrorMessage(null);
      setSyncing(true);
      try {
        await createWorkspaceAuditNoteInFirestore(params);
        setLastSyncedAt(new Date().toISOString());
        return true;
      } catch (err) {
        inspectAndFormatError(err);
        return false;
      } finally {
        setSyncing(false);
      }
    },
    [inspectAndFormatError]
  );

  const resolveAuditNote = useCallback(
    async (params: {
      workspaceId: string;
      noteId: string;
      summaryText: string;
    }): Promise<boolean> => {
      setErrorMessage(null);
      setSyncing(true);
      try {
        await updateWorkspaceAuditNoteStatusInFirestore({
          workspaceId: params.workspaceId,
          noteId: params.noteId,
          summaryText: params.summaryText,
          actionStatus: 'RESOLVED',
        });
        setLastSyncedAt(new Date().toISOString());
        return true;
      } catch (err) {
        inspectAndFormatError(err);
        return false;
      } finally {
        setSyncing(false);
      }
    },
    [inspectAndFormatError]
  );

  const syncLeadRecord = useCallback(
    async (lead: {
      leadId: string;
      fullName: string;
      companyName: string;
      plantLocation?: string;
      erpSystem?: string;
      diagnosticScore?: number;
    }): Promise<boolean> => {
      setErrorMessage(null);
      setSyncing(true);
      try {
        const ok = await syncPilotLeadToFirestore(lead);
        if (ok) {
          setLastSyncedAt(new Date().toISOString());
        }
        return ok;
      } catch (err) {
        inspectAndFormatError(err);
        return false;
      } finally {
        setSyncing(false);
      }
    },
    [inspectAndFormatError]
  );

  const clearError = useCallback(() => {
    setErrorMessage(null);
    setQuotaExceededUrl(null);
  }, []);

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authReady,
        connectionStatus,
        projectId: FIREBASE_PROJECT_ID,
        databaseId: FIRESTORE_DATABASE_ID,
        publicProfile,
        privateInfo,
        syncedWorkspaces,
        syncedLeads,
        auditNotes,
        lastSyncedAt,
        syncing,
        errorMessage,
        quotaExceededUrl,
        signInWithGoogle,
        signOutUser,
        syncActivePlant,
        removeSyncedWorkspace,
        addAuditNote,
        resolveAuditNote,
        syncLeadRecord,
        clearError,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export function useFirebase(): FirebaseContextState {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return ctx;
}
