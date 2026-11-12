import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  VALID_ID_REGEX,
  MAX_ID_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_COMPANY_NAME_LENGTH,
  OperationType,
  handleFirestoreError,
  sanitizeUserPublicProfileInput,
  sanitizeUserPrivateInfoInput,
  sanitizePilotRequestInput,
  sanitizePlantWorkspaceInput,
} from './src/firebase';

// ============================================================================
// DETERMINISTIC FIRESTORE RULES EVALUATOR FOR THE "DIRTY DOZEN" PAYLOAD TDD
// ============================================================================

interface AuthContext {
  uid: string;
  token: {
    email?: string;
    email_verified?: boolean;
  };
}

interface RuleEvaluationContext {
  op: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: AuthContext | null;
  requestTime: string;
  incomingData?: Record<string, unknown>;
  existingData?: Record<string, unknown>;
  parentDocs?: Record<string, Record<string, unknown>>;
  adminUids?: string[];
}

function isValidId(id: unknown, maxLen: number = 128): boolean {
  return (
    typeof id === 'string' &&
    id.length >= 1 &&
    id.length <= maxLen &&
    VALID_ID_REGEX.test(id)
  );
}

function hasAllKeys(data: Record<string, unknown>, reqKeys: string[]): boolean {
  return reqKeys.every((k) => Object.prototype.hasOwnProperty.call(data, k));
}

function hasOnlyKeys(data: Record<string, unknown>, allowedKeys: string[]): boolean {
  return Object.keys(data).every((k) => allowedKeys.includes(k));
}

function affectedKeys(
  incoming: Record<string, unknown>,
  existing: Record<string, unknown>
): string[] {
  const allKeys = new Set([...Object.keys(incoming), ...Object.keys(existing)]);
  const changed: string[] = [];
  for (const k of allKeys) {
    if (incoming[k] !== existing[k]) {
      changed.push(k);
    }
  }
  return changed;
}

function evaluateRules(ctx: RuleEvaluationContext): 'ALLOWED' | 'PERMISSION_DENIED' {
  const isSignedIn = ctx.auth !== null;
  const isVerifiedUser = isSignedIn && ctx.auth?.token.email_verified === true;
  const isAdmin =
    isVerifiedUser &&
    (Boolean(ctx.adminUids?.includes(ctx.auth!.uid)) ||
      ctx.auth?.token.email === 'joneszz2004@gmail.com');

  const segments = ctx.path.replace(/^\/+/, '').split('/');

  // 1. /users/{userId}
  if (segments.length === 2 && segments[0] === 'users') {
    const userId = segments[1];
    const validBlueprint = (data?: Record<string, unknown>) => {
      if (!data || !ctx.auth) return false;
      const req = ['uid', 'displayName', 'companyName', 'role', 'createdAt', 'updatedAt'];
      if (!hasAllKeys(data, req) || !hasOnlyKeys(data, req)) return false;
      if (!isValidId(data.uid) || data.uid !== userId || data.uid !== ctx.auth.uid) return false;
      if (
        typeof data.displayName !== 'string' ||
        data.displayName.length < 1 ||
        data.displayName.length > 120
      )
        return false;
      if (
        typeof data.companyName !== 'string' ||
        data.companyName.length < 1 ||
        data.companyName.length > 160
      )
        return false;
      if (
        typeof data.role !== 'string' ||
        !['owner', 'ops_head', 'auditor', 'viewer'].includes(data.role)
      )
        return false;
      if (typeof data.createdAt !== 'string' || typeof data.updatedAt !== 'string') return false;
      if (data.updatedAt !== ctx.requestTime) return false;
      return true;
    };

    if (ctx.op === 'get') {
      return isSignedIn && isValidId(userId) && (ctx.auth!.uid === userId || isAdmin)
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    if (ctx.op === 'create') {
      return isVerifiedUser &&
        isValidId(userId) &&
        validBlueprint(ctx.incomingData) &&
        ctx.incomingData?.createdAt === ctx.requestTime
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    if (ctx.op === 'update') {
      if (!isVerifiedUser || !isValidId(userId) || !validBlueprint(ctx.incomingData) || !ctx.existingData) {
        return 'PERMISSION_DENIED';
      }
      if (
        ctx.incomingData!.uid !== ctx.existingData.uid ||
        ctx.incomingData!.createdAt !== ctx.existingData.createdAt
      ) {
        return 'PERMISSION_DENIED';
      }
      const changed = affectedKeys(ctx.incomingData!, ctx.existingData);
      const allowedChanged = ['displayName', 'companyName', 'role', 'updatedAt'];
      if (isAdmin || (ctx.auth!.uid === userId && changed.every((k) => allowedChanged.includes(k)))) {
        return 'ALLOWED';
      }
      return 'PERMISSION_DENIED';
    }
    return 'PERMISSION_DENIED';
  }

  // 2. /users/{userId}/private/{docId}
  if (segments.length === 4 && segments[0] === 'users' && segments[2] === 'private') {
    const userId = segments[1];
    const docId = segments[3];
    if (ctx.op === 'get') {
      return isSignedIn &&
        isValidId(userId) &&
        isValidId(docId) &&
        (ctx.auth!.uid === userId || isAdmin)
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    return 'PERMISSION_DENIED';
  }

  // 3. /pilot_requests/{leadId}
  if (segments.length === 2 && segments[0] === 'pilot_requests') {
    const leadId = segments[1];
    const validBlueprint = (data?: Record<string, unknown>) => {
      if (!data) return false;
      const req = [
        'leadId',
        'ownerId',
        'fullName',
        'companyName',
        'plantLocation',
        'erpSystem',
        'status',
        'diagnosticScore',
        'createdAt',
        'updatedAt',
      ];
      if (!hasAllKeys(data, req) || !hasOnlyKeys(data, req)) return false;
      if (
        typeof data.leadId !== 'string' ||
        data.leadId.length < 3 ||
        data.leadId.length > 64 ||
        !VALID_ID_REGEX.test(data.leadId) ||
        data.leadId !== leadId
      )
        return false;
      if (!isValidId(data.ownerId)) return false;
      if (typeof data.fullName !== 'string' || data.fullName.length < 2 || data.fullName.length > 120)
        return false;
      if (
        typeof data.companyName !== 'string' ||
        data.companyName.length < 2 ||
        data.companyName.length > 160
      )
        return false;
      if (
        typeof data.plantLocation !== 'string' ||
        data.plantLocation.length < 2 ||
        data.plantLocation.length > 160
      )
        return false;
      if (
        typeof data.erpSystem !== 'string' ||
        data.erpSystem.length < 1 ||
        data.erpSystem.length > 120
      )
        return false;
      if (
        typeof data.status !== 'string' ||
        !['NEW', 'SUITABILITY_REVIEW', 'NDA_SENT', 'APPROVED_FOR_UPLOAD', 'CLOSED'].includes(
          data.status
        )
      )
        return false;
      if (
        typeof data.diagnosticScore !== 'number' ||
        data.diagnosticScore < 0 ||
        data.diagnosticScore > 100
      )
        return false;
      if (typeof data.createdAt !== 'string' || typeof data.updatedAt !== 'string') return false;
      if (data.updatedAt !== ctx.requestTime) return false;
      return true;
    };

    if (ctx.op === 'create') {
      return isVerifiedUser &&
        isValidId(leadId) &&
        validBlueprint(ctx.incomingData) &&
        ctx.incomingData?.ownerId === ctx.auth!.uid &&
        ctx.incomingData?.status === 'NEW' &&
        ctx.incomingData?.createdAt === ctx.requestTime
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    return 'PERMISSION_DENIED';
  }

  // 4. /plant_workspaces/{workspaceId}
  if (segments.length === 2 && segments[0] === 'plant_workspaces') {
    const workspaceId = segments[1];
    const validBlueprint = (data?: Record<string, unknown>) => {
      if (!data) return false;
      const req = [
        'workspaceId',
        'ownerId',
        'plantId',
        'plantName',
        'skuCount',
        'totalStockValueInr',
        'nonMovingValueInr',
        'otifPercent',
        'freightLeakInr',
        'binMatchPercent',
        'status',
        'createdAt',
        'updatedAt',
      ];
      if (!hasAllKeys(data, req) || !hasOnlyKeys(data, req)) return false;
      if (
        typeof data.workspaceId !== 'string' ||
        data.workspaceId.length < 2 ||
        data.workspaceId.length > 128 ||
        !VALID_ID_REGEX.test(data.workspaceId) ||
        data.workspaceId !== workspaceId
      )
        return false;
      if (!isValidId(data.ownerId)) return false;
      if (
        typeof data.plantId !== 'string' ||
        !['ambattur', 'sriperumbudur', 'hosur'].includes(data.plantId)
      )
        return false;
      if (
        typeof data.plantName !== 'string' ||
        data.plantName.length < 2 ||
        data.plantName.length > 160
      )
        return false;
      if (typeof data.skuCount !== 'number' || data.skuCount < 0 || data.skuCount > 500000)
        return false;
      if (
        typeof data.totalStockValueInr !== 'number' ||
        data.totalStockValueInr < 0 ||
        data.totalStockValueInr > 100000000000
      )
        return false;
      if (
        typeof data.nonMovingValueInr !== 'number' ||
        data.nonMovingValueInr < 0 ||
        data.nonMovingValueInr > 100000000000
      )
        return false;
      if (typeof data.otifPercent !== 'number' || data.otifPercent < 0 || data.otifPercent > 100)
        return false;
      if (
        typeof data.freightLeakInr !== 'number' ||
        data.freightLeakInr < 0 ||
        data.freightLeakInr > 10000000000
      )
        return false;
      if (
        typeof data.binMatchPercent !== 'number' ||
        data.binMatchPercent < 0 ||
        data.binMatchPercent > 100
      )
        return false;
      if (typeof data.status !== 'string' || !['ACTIVE', 'LOCKED_FINAL'].includes(data.status))
        return false;
      if (typeof data.createdAt !== 'string' || typeof data.updatedAt !== 'string') return false;
      if (data.updatedAt !== ctx.requestTime) return false;
      return true;
    };

    if (ctx.op === 'create') {
      return isVerifiedUser &&
        isValidId(workspaceId) &&
        validBlueprint(ctx.incomingData) &&
        ctx.incomingData?.ownerId === ctx.auth!.uid &&
        ctx.incomingData?.status === 'ACTIVE' &&
        ctx.incomingData?.createdAt === ctx.requestTime
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    if (ctx.op === 'update') {
      if (
        !isVerifiedUser ||
        !isValidId(workspaceId) ||
        !validBlueprint(ctx.incomingData) ||
        !ctx.existingData
      ) {
        return 'PERMISSION_DENIED';
      }
      if (
        ctx.incomingData!.workspaceId !== ctx.existingData.workspaceId ||
        ctx.incomingData!.ownerId !== ctx.existingData.ownerId ||
        ctx.incomingData!.plantId !== ctx.existingData.plantId ||
        ctx.incomingData!.createdAt !== ctx.existingData.createdAt
      ) {
        return 'PERMISSION_DENIED';
      }
      if (isAdmin) return 'ALLOWED';
      if (
        ctx.existingData.ownerId === ctx.auth!.uid &&
        ctx.existingData.status !== 'LOCKED_FINAL'
      ) {
        const changed = affectedKeys(ctx.incomingData!, ctx.existingData);
        const action1Keys = [
          'plantName',
          'skuCount',
          'totalStockValueInr',
          'nonMovingValueInr',
          'otifPercent',
          'freightLeakInr',
          'binMatchPercent',
          'updatedAt',
        ];
        const action2Keys = ['status', 'updatedAt'];
        if (
          changed.every((k) => action1Keys.includes(k)) ||
          changed.every((k) => action2Keys.includes(k))
        ) {
          return 'ALLOWED';
        }
      }
      return 'PERMISSION_DENIED';
    }
    return 'PERMISSION_DENIED';
  }

  // 5. /plant_workspaces/{workspaceId}/audit_notes/{noteId}
  if (
    segments.length === 4 &&
    segments[0] === 'plant_workspaces' &&
    segments[2] === 'audit_notes'
  ) {
    const workspaceId = segments[1];
    const noteId = segments[3];
    const parentDoc = ctx.parentDocs?.[`plant_workspaces/${workspaceId}`];
    const isParentOwner = Boolean(parentDoc && parentDoc.ownerId === ctx.auth?.uid);

    if (ctx.op === 'create') {
      if (!isVerifiedUser || !isValidId(workspaceId) || !isValidId(noteId, 64)) {
        return 'PERMISSION_DENIED';
      }
      const d = ctx.incomingData;
      if (!d) return 'PERMISSION_DENIED';
      const req = [
        'noteId',
        'workspaceId',
        'authorId',
        'pillar',
        'summaryText',
        'actionStatus',
        'createdAt',
        'updatedAt',
      ];
      if (!hasAllKeys(d, req) || !hasOnlyKeys(d, req)) return 'PERMISSION_DENIED';
      if (
        d.noteId !== noteId ||
        d.workspaceId !== workspaceId ||
        d.authorId !== ctx.auth!.uid ||
        d.createdAt !== ctx.requestTime ||
        d.updatedAt !== ctx.requestTime
      ) {
        return 'PERMISSION_DENIED';
      }
      if (!isParentOwner && !isAdmin) {
        return 'PERMISSION_DENIED';
      }
      return 'ALLOWED';
    }
    return 'PERMISSION_DENIED';
  }

  return 'PERMISSION_DENIED';
}

// ============================================================================
// TEST SUITE: DIRTY DOZEN PAYLOADS + BLUEPRINT & RULES VERIFICATION
// ============================================================================

const NOW_ISO = '2026-11-11T12:00:00.000Z';
const VERIFIED_USER_A: AuthContext = {
  uid: 'user_alpha_01',
  token: { email: 'alpha@factory.in', email_verified: true },
};

test('Dirty Dozen #1: Unauthenticated Write is rejected with PERMISSION_DENIED', () => {
  const res = evaluateRules({
    op: 'create',
    path: '/pilot_requests/PILOT-20261111-0001',
    auth: null,
    requestTime: NOW_ISO,
    incomingData: {
      leadId: 'PILOT-20261111-0001',
      ownerId: 'user_alpha_01',
      fullName: 'R. Sundaram',
      companyName: 'Sundaram Castings',
      plantLocation: 'Ambattur, Chennai',
      erpSystem: 'Tally Prime',
      status: 'NEW',
      diagnosticScore: 78,
      createdAt: NOW_ISO,
      updatedAt: NOW_ISO,
    },
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #2: Email Spoofing (admin email with email_verified == false) is rejected with PERMISSION_DENIED', () => {
  const res = evaluateRules({
    op: 'create',
    path: '/pilot_requests/PILOT-20261111-0002',
    auth: {
      uid: 'spoof_uid',
      token: { email: 'joneszz2004@gmail.com', email_verified: false },
    },
    requestTime: NOW_ISO,
    incomingData: {
      leadId: 'PILOT-20261111-0002',
      ownerId: 'spoof_uid',
      fullName: 'Spoof Attacker',
      companyName: 'Spoof Corp',
      plantLocation: 'Chennai',
      erpSystem: 'Tally',
      status: 'NEW',
      diagnosticScore: 50,
      createdAt: NOW_ISO,
      updatedAt: NOW_ISO,
    },
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #3: Shadow Field Injection (isAdmin: true ghost key) is rejected with PERMISSION_DENIED', () => {
  const res = evaluateRules({
    op: 'create',
    path: '/users/user_alpha_01',
    auth: VERIFIED_USER_A,
    requestTime: NOW_ISO,
    incomingData: {
      uid: 'user_alpha_01',
      displayName: 'Alpha User',
      companyName: 'Alpha Forgings',
      role: 'owner',
      isAdmin: true, // Ghost shadow field
      createdAt: NOW_ISO,
      updatedAt: NOW_ISO,
    },
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #4: Privilege Escalation Role Assignment (role: super_admin) is rejected with PERMISSION_DENIED', () => {
  const res = evaluateRules({
    op: 'create',
    path: '/users/user_alpha_01',
    auth: VERIFIED_USER_A,
    requestTime: NOW_ISO,
    incomingData: {
      uid: 'user_alpha_01',
      displayName: 'Alpha User',
      companyName: 'Alpha Forgings',
      role: 'super_admin',
      createdAt: NOW_ISO,
      updatedAt: NOW_ISO,
    },
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #5: PII Cross-User Read on /users/{victim}/private/info is rejected with PERMISSION_DENIED', () => {
  const res = evaluateRules({
    op: 'get',
    path: '/users/victim_user_99/private/info',
    auth: VERIFIED_USER_A,
    requestTime: NOW_ISO,
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #6: Identity Spoofing on Create (setting ownerId to another user) is rejected with PERMISSION_DENIED', () => {
  const res = evaluateRules({
    op: 'create',
    path: '/plant_workspaces/ws_alpha_ambattur',
    auth: VERIFIED_USER_A,
    requestTime: NOW_ISO,
    incomingData: {
      workspaceId: 'ws_alpha_ambattur',
      ownerId: 'victim_user_99',
      plantId: 'ambattur',
      plantName: 'Ambattur Unit',
      skuCount: 20,
      totalStockValueInr: 645650,
      nonMovingValueInr: 223110,
      otifPercent: 50,
      freightLeakInr: 13944,
      binMatchPercent: 60,
      status: 'ACTIVE',
      createdAt: NOW_ISO,
      updatedAt: NOW_ISO,
    },
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #7: Immortal Field Mutation (changing ownerId or createdAt on update) is rejected with PERMISSION_DENIED', () => {
  const existing = {
    workspaceId: 'ws_alpha_ambattur',
    ownerId: 'user_alpha_01',
    plantId: 'ambattur',
    plantName: 'Ambattur Unit',
    skuCount: 20,
    totalStockValueInr: 645650,
    nonMovingValueInr: 223110,
    otifPercent: 50,
    freightLeakInr: 13944,
    binMatchPercent: 60,
    status: 'ACTIVE',
    createdAt: '2026-11-10T00:00:00.000Z',
    updatedAt: '2026-11-10T00:00:00.000Z',
  };
  const res = evaluateRules({
    op: 'update',
    path: '/plant_workspaces/ws_alpha_ambattur',
    auth: VERIFIED_USER_A,
    requestTime: NOW_ISO,
    existingData: existing,
    incomingData: {
      ...existing,
      createdAt: NOW_ISO, // Mutating immortal createdAt
      updatedAt: NOW_ISO,
    },
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #8: Terminal State Bypass (updating a LOCKED_FINAL workspace) is rejected with PERMISSION_DENIED', () => {
  const existing = {
    workspaceId: 'ws_alpha_ambattur',
    ownerId: 'user_alpha_01',
    plantId: 'ambattur',
    plantName: 'Ambattur Unit',
    skuCount: 20,
    totalStockValueInr: 645650,
    nonMovingValueInr: 223110,
    otifPercent: 50,
    freightLeakInr: 13944,
    binMatchPercent: 60,
    status: 'LOCKED_FINAL',
    createdAt: '2026-11-10T00:00:00.000Z',
    updatedAt: '2026-11-10T00:00:00.000Z',
  };
  const res = evaluateRules({
    op: 'update',
    path: '/plant_workspaces/ws_alpha_ambattur',
    auth: VERIFIED_USER_A,
    requestTime: NOW_ISO,
    existingData: existing,
    incomingData: {
      ...existing,
      otifPercent: 85,
      updatedAt: NOW_ISO,
    },
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #9: Client Timestamp Forgery (createdAt != request.time) is rejected with PERMISSION_DENIED', () => {
  const res = evaluateRules({
    op: 'create',
    path: '/pilot_requests/PILOT-20261111-0009',
    auth: VERIFIED_USER_A,
    requestTime: NOW_ISO,
    incomingData: {
      leadId: 'PILOT-20261111-0009',
      ownerId: 'user_alpha_01',
      fullName: 'R. Sundaram',
      companyName: 'Sundaram Castings',
      plantLocation: 'Ambattur, Chennai',
      erpSystem: 'Tally Prime',
      status: 'NEW',
      diagnosticScore: 78,
      createdAt: '2020-01-01T00:00:00.000Z', // Forged backdated timestamp
      updatedAt: NOW_ISO,
    },
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #10: Master Gate Orphan Subcollection Write is rejected with PERMISSION_DENIED', () => {
  const res = evaluateRules({
    op: 'create',
    path: '/plant_workspaces/ws_orphan/audit_notes/note_01',
    auth: VERIFIED_USER_A,
    requestTime: NOW_ISO,
    parentDocs: {}, // Parent workspace does not exist
    incomingData: {
      noteId: 'note_01',
      workspaceId: 'ws_orphan',
      authorId: 'user_alpha_01',
      pillar: 'P1_INVENTORY',
      summaryText: 'Freeze reorders on dormant SG Iron castings.',
      actionStatus: 'OPEN',
      createdAt: NOW_ISO,
      updatedAt: NOW_ISO,
    },
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #11: Path Variable / ID Poisoning (illegal characters in ID) is rejected with PERMISSION_DENIED', () => {
  const res = evaluateRules({
    op: 'create',
    path: '/plant_workspaces/bad$id!@#',
    auth: VERIFIED_USER_A,
    requestTime: NOW_ISO,
    incomingData: {
      workspaceId: 'bad$id!@#',
      ownerId: 'user_alpha_01',
      plantId: 'ambattur',
      plantName: 'Ambattur Unit',
      skuCount: 20,
      totalStockValueInr: 645650,
      nonMovingValueInr: 223110,
      otifPercent: 50,
      freightLeakInr: 13944,
      binMatchPercent: 60,
      status: 'ACTIVE',
      createdAt: NOW_ISO,
      updatedAt: NOW_ISO,
    },
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen #12: Value Poisoning on Whitelisted Update Key (otifPercent > 100) is rejected with PERMISSION_DENIED', () => {
  const existing = {
    workspaceId: 'ws_alpha_ambattur',
    ownerId: 'user_alpha_01',
    plantId: 'ambattur',
    plantName: 'Ambattur Unit',
    skuCount: 20,
    totalStockValueInr: 645650,
    nonMovingValueInr: 223110,
    otifPercent: 50,
    freightLeakInr: 13944,
    binMatchPercent: 60,
    status: 'ACTIVE',
    createdAt: '2026-11-10T00:00:00.000Z',
    updatedAt: '2026-11-10T00:00:00.000Z',
  };
  const res = evaluateRules({
    op: 'update',
    path: '/plant_workspaces/ws_alpha_ambattur',
    auth: VERIFIED_USER_A,
    requestTime: NOW_ISO,
    existingData: existing,
    incomingData: {
      ...existing,
      otifPercent: 999, // Out of 0..100 boundary
      updatedAt: NOW_ISO,
    },
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Valid authenticated operations and firebase-blueprint.json / firestore.rules synchronicity pass 100%', async () => {
  // 1. Verify valid workspace create & Master Gate subcollection note create
  const validWsCreate = evaluateRules({
    op: 'create',
    path: '/plant_workspaces/ws_alpha_ambattur',
    auth: VERIFIED_USER_A,
    requestTime: NOW_ISO,
    incomingData: {
      workspaceId: 'ws_alpha_ambattur',
      ownerId: 'user_alpha_01',
      plantId: 'ambattur',
      plantName: 'Ambattur Baseline Unit',
      skuCount: 20,
      totalStockValueInr: 645650,
      nonMovingValueInr: 223110,
      otifPercent: 50,
      freightLeakInr: 13944,
      binMatchPercent: 60,
      status: 'ACTIVE',
      createdAt: NOW_ISO,
      updatedAt: NOW_ISO,
    },
  });
  assert.equal(validWsCreate, 'ALLOWED');

  const validNoteCreate = evaluateRules({
    op: 'create',
    path: '/plant_workspaces/ws_alpha_ambattur/audit_notes/note_01',
    auth: VERIFIED_USER_A,
    requestTime: NOW_ISO,
    parentDocs: {
      'plant_workspaces/ws_alpha_ambattur': {
        ownerId: 'user_alpha_01',
      },
    },
    incomingData: {
      noteId: 'note_01',
      workspaceId: 'ws_alpha_ambattur',
      authorId: 'user_alpha_01',
      pillar: 'P1_INVENTORY',
      summaryText: 'Freeze reorders on dormant SG Iron castings.',
      actionStatus: 'OPEN',
      createdAt: NOW_ISO,
      updatedAt: NOW_ISO,
    },
  });
  assert.equal(validNoteCreate, 'ALLOWED');

  // 2. Verify firebase-blueprint.json & firestore.rules structural synchronicity
  const blueprintRaw = await fs.readFile(
    path.join(process.cwd(), 'firebase-blueprint.json'),
    'utf-8'
  );
  const blueprint = JSON.parse(blueprintRaw);
  assert.ok(blueprint.entities.UserPublicProfile);
  assert.ok(blueprint.entities.UserPrivateInfo);
  assert.ok(blueprint.entities.PilotRequestDoc);
  assert.ok(blueprint.entities.PlantWorkspaceCloudSnapshot);
  assert.ok(blueprint.entities.WorkspaceAuditNote);
  assert.ok(blueprint.entities.AdminRecord);

  const rulesRaw = await fs.readFile(path.join(process.cwd(), 'firestore.rules'), 'utf-8');
  assert.ok(rulesRaw.includes("rules_version = '2';"));
  assert.ok(rulesRaw.includes('match /{document=**}'));
  assert.ok(rulesRaw.includes('match /users/{userId}'));
  assert.ok(rulesRaw.includes('match /private/{docId}'));
  assert.ok(rulesRaw.includes('match /pilot_requests/{leadId}'));
  assert.ok(rulesRaw.includes('match /plant_workspaces/{workspaceId}'));
  assert.ok(rulesRaw.includes('match /audit_notes/{noteId}'));
  assert.ok(rulesRaw.includes('match /admins/{adminUid}'));
  assert.ok(rulesRaw.includes("request.auth.token.email == 'joneszz2004@gmail.com'"));

  // 3. Verify defensive payload sanitizers in src/firebase.ts
  const pub = sanitizeUserPublicProfileInput({
    uid: 'user_alpha_01',
    displayName: 'A'.repeat(250),
    companyName: 'B'.repeat(250),
    role: 'invalid_role',
  });
  assert.equal(pub.displayName.length, MAX_DISPLAY_NAME_LENGTH);
  assert.equal(pub.companyName.length, MAX_COMPANY_NAME_LENGTH);
  assert.equal(pub.role, 'owner');

  const priv = sanitizeUserPrivateInfoInput({
    uid: 'user_alpha_01',
    email: 'joneszz2004@gmail.com',
    phoneOrWhatsapp: '+91 90805 40047',
    plantLocation: 'Ambattur, Chennai',
  });
  assert.equal(priv.email, 'joneszz2004@gmail.com');

  const lead = sanitizePilotRequestInput({
    leadId: 'PILOT-20261111-ABCD',
    ownerId: 'user_alpha_01',
    fullName: 'C. Jones Snowin',
    companyName: 'Snowin Ventures',
    diagnosticScore: 145, // Clamped to 100
  });
  assert.equal(lead.diagnosticScore, 100);
  assert.equal(lead.status, 'NEW');

  const ws = sanitizePlantWorkspaceInput({
    ownerId: 'user_alpha_01',
    plantId: 'ambattur',
  });
  assert.equal(ws.workspaceId.length <= MAX_ID_LENGTH, true);
  assert.equal(ws.plantId, 'ambattur');
  assert.equal(ws.skuCount, 20);
  assert.equal(ws.nonMovingValueInr, 223110);

  // 4. Verify handleFirestoreError throws structured JSON matching FirestoreErrorInfo
  assert.throws(
    () => {
      handleFirestoreError(
        new Error('Missing or insufficient permissions.'),
        OperationType.GET,
        'plant_workspaces/ws_1'
      );
    },
    (err: unknown) => {
      assert.ok(err instanceof Error);
      const parsed = JSON.parse(err.message);
      assert.equal(parsed.error, 'Missing or insufficient permissions.');
      assert.equal(parsed.operationType, 'get');
      assert.equal(parsed.path, 'plant_workspaces/ws_1');
      assert.ok(parsed.authInfo);
      return true;
    }
  );
});
