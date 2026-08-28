import fs from 'fs';
import path from 'path';
import { RecoveryCase, AuditLog, MetricsSummary } from '../agent/types';

const DB_FILE = path.join(process.cwd(), 'revivepay-db.json');

interface DatabaseStructure {
  recovery_cases: RecoveryCase[];
  audit_logs: AuditLog[];
}

function loadDatabase(): DatabaseStructure {
  if (!fs.existsSync(DB_FILE)) {
    const initial: DatabaseStructure = { recovery_cases: [], audit_logs: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    const initial: DatabaseStructure = { recovery_cases: [], audit_logs: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

function saveDatabase(data: DatabaseStructure): void {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function getAllCases(): RecoveryCase[] {
  const db = loadDatabase();
  return db.recovery_cases.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getCaseById(id: string): RecoveryCase | null {
  const db = loadDatabase();
  return db.recovery_cases.find(c => c.id === id) || null;
}

export function updateCase(id: string, updates: Partial<RecoveryCase>): RecoveryCase | null {
  const db = loadDatabase();
  const index = db.recovery_cases.findIndex(c => c.id === id);
  if (index === -1) return null;

  const current = db.recovery_cases[index];
  const updated: RecoveryCase = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  db.recovery_cases[index] = updated;
  saveDatabase(db);
  return updated;
}

export function getAuditLogsByCaseId(caseId: string): AuditLog[] {
  const db = loadDatabase();
  return db.audit_logs
    .filter(l => l.case_id === caseId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function addAuditLog(log: Omit<AuditLog, 'id'>): AuditLog {
  const db = loadDatabase();
  const newLog: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...log,
  };

  db.audit_logs.push(newLog);
  saveDatabase(db);
  return newLog;
}

export function getMetricsSummary(): MetricsSummary {
  const cases = getAllCases();

  const total_cases = cases.length;
  const total_revenue_at_risk = cases.reduce((acc, c) => acc + c.amount, 0);
  const total_recovered = cases.reduce((acc, c) => acc + c.recovered_amount, 0);
  const recovery_rate =
    total_revenue_at_risk > 0
      ? Number(((total_recovered / total_revenue_at_risk) * 100).toFixed(1))
      : 0;

  const active_cases = cases.filter(c => c.status === 'at_risk' || c.status === 'recovering').length;
  const recovered_cases = cases.filter(c => c.status === 'recovered').length;
  const escalated_cases = cases.filter(c => c.status === 'escalated').length;
  const failed_cases = cases.filter(c => c.status === 'failed').length;

  return {
    total_revenue_at_risk,
    total_recovered,
    recovery_rate,
    total_cases,
    active_cases,
    recovered_cases,
    escalated_cases,
    failed_cases,
  };
}

export function clearAndSeedCases(seededCases: RecoveryCase[]): void {
  const data: DatabaseStructure = {
    recovery_cases: seededCases,
    audit_logs: [],
  };
  saveDatabase(data);
}

