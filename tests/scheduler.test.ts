import {
  findMatchingStage,
  generateReminderIdempotencyKey,
  isWithinOperationalHours,
  DEFAULT_STAGES,
} from '../src/lib/server/schedulerEngine';
import { formatWhatsAppPhoneNumber } from '../src/lib/server/whatsappCloudApi';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
  console.log(`✓ ${message}`);
}

console.log('--- RUNNING PRODUCTION SCHEDULER & WHATSAPP UNIT TESTS ---');

// 1. Test exact directional stage matching
const stage30 = findMatchingStage(30, DEFAULT_STAGES);
assert(stage30?.id === 'stage_before_30', 'Day 30 matches 30 Days Before stage');

const stage15 = findMatchingStage(15, DEFAULT_STAGES);
assert(stage15?.id === 'stage_before_15', 'Day 15 matches 15 Days Before stage');

const stageDueToday = findMatchingStage(0, DEFAULT_STAGES);
assert(stageDueToday?.id === 'stage_due_today', 'Day 0 matches Due Today stage');

const stageOverdue1 = findMatchingStage(-1, DEFAULT_STAGES);
assert(stageOverdue1?.id === 'stage_overdue_1', 'Day -1 matches 1 Day Overdue stage');

const stageOverdue7 = findMatchingStage(-7, DEFAULT_STAGES);
assert(stageOverdue7?.id === 'stage_overdue_7', 'Day -7 matches 7 Days Overdue stage');

const stageOverdue30 = findMatchingStage(-30, DEFAULT_STAGES);
assert(stageOverdue30?.id === 'stage_overdue_30', 'Day -30 matches 30 Days Overdue stage');

const stageUnmatched = findMatchingStage(42, DEFAULT_STAGES);
assert(stageUnmatched === null, 'Day 42 has no matching stage');

// Verify overdue (-5 days) is NOT matched as Due Today
const stageMinus5 = findMatchingStage(-5, DEFAULT_STAGES);
assert(stageMinus5?.id !== 'stage_due_today', 'Overdue -5 days is not mistakenly classified as Due Today');

// 2. Test Idempotency Key Generation
const key1 = generateReminderIdempotencyKey('biz-1', 'cust-1', 'rnw-1', 'stage_due_today', '2026-10-28');
const key2 = generateReminderIdempotencyKey('biz-1', 'cust-1', 'rnw-1', 'stage_due_today', '2026-10-28');
const key3 = generateReminderIdempotencyKey('biz-1', 'cust-1', 'rnw-1', 'stage_overdue_1', '2026-10-28');

assert(key1 === key2, 'Identical renewal & stage parameters generate identical SHA-256 idempotency key');
assert(key1 !== key3, 'Different stages generate different SHA-256 keys');
assert(key1.length === 64, 'Idempotency key is a valid 64-character SHA-256 hex string');

// 3. Test WhatsApp Phone Number Formatting
const formatted1 = formatWhatsAppPhoneNumber('9876543210');
assert(formatted1 === '919876543210', '10-digit mobile number formats to 919876543210');

const formatted2 = formatWhatsAppPhoneNumber('+91 98765 43210');
assert(formatted2 === '919876543210', 'Formatted string with +91 and spaces normalizes to 919876543210');

const formatted3 = formatWhatsAppPhoneNumber('919876543210');
assert(formatted3 === '919876543210', 'Already international number is preserved');

// 4. Test Operational Quiet Hours
const quietCheck = typeof isWithinOperationalHours('Asia/Kolkata') === 'boolean';
assert(quietCheck, 'Operational hours evaluation returns boolean');

console.log('--- ALL UNIT TESTS PASSED SUCCESSFULLY! ---');
