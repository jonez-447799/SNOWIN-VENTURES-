/**
 * Local Demonstration Export & Browser Storage Cleanup Utilities
 * Note: Hardcoded passphrases and static salts have been removed.
 * Data exported from this module is a local demonstration JSON snapshot, not an enterprise encrypted vault.
 */

export interface LocalExportSnapshot {
  exportType: 'LOCAL_DEMONSTRATION_EXPORT';
  notice: string;
  timestamp: string;
  data: unknown;
}

/**
 * Builds a clearly labeled local demonstration export payload.
 */
export function createLocalDemonstrationExport(data: unknown): LocalExportSnapshot {
  return {
    exportType: 'LOCAL_DEMONSTRATION_EXPORT',
    notice:
      'Local demonstration export only. Operational information is stored in this browser and is not encrypted with an organization key.',
    timestamp: new Date().toISOString(),
    data,
  };
}

/**
 * Clears local demonstration data from browser localStorage.
 */
export function clearLocalDemonstrationStorage(): void {
  ['p1_stock_items', 'p1_stock_rules', 'p1_audit_logs', 'p1_vault_session'].forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage access errors
    }
  });
}

// Keep alias for backward import compatibility while performing honest local storage removal
export const secureDataShredder = clearLocalDemonstrationStorage;
