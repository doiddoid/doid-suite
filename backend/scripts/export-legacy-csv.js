/**
 * Export contatti dal DB legacy (MySQL dump) per GHL
 * Parsing diretto del file SQL
 *
 * Uso: node scripts/export-legacy-csv.js <path-to-sql-dump>
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = process.argv[2];
if (!sqlPath) {
  console.error('Uso: node scripts/export-legacy-csv.js <path-to-sql-dump>');
  process.exit(1);
}

const sql = readFileSync(resolve(sqlPath), 'utf-8');

// Parse INSERT VALUES from SQL
function parseInserts(sql, table) {
  // Match the INSERT block for this table
  const regex = new RegExp(
    `INSERT INTO \`${table}\`\\s*\\(([^)]+)\\)\\s*VALUES\\s*([\\s\\S]*?)(?=;\\s*(?:--|INSERT|CREATE|ALTER|COMMIT|$))`,
    'gi'
  );
  const rows = [];
  let match;
  while ((match = regex.exec(sql)) !== null) {
    const cols = match[1].replace(/`/g, '').split(',').map(c => c.trim());
    const valuesBlock = match[2];

    // Parse individual row tuples
    let depth = 0;
    let inString = false;
    let escape = false;
    let current = '';
    let tuples = [];

    for (let i = 0; i < valuesBlock.length; i++) {
      const ch = valuesBlock[i];
      if (escape) { current += ch; escape = false; continue; }
      if (ch === '\\') { current += ch; escape = true; continue; }
      if (ch === "'" && !inString) { inString = true; current += ch; continue; }
      if (ch === "'" && inString) {
        // Check for ''
        if (valuesBlock[i + 1] === "'") { current += "''"; i++; continue; }
        inString = false; current += ch; continue;
      }
      if (inString) { current += ch; continue; }
      if (ch === '(') { depth++; if (depth === 1) { current = ''; continue; } }
      if (ch === ')') {
        depth--;
        if (depth === 0) {
          tuples.push(current);
          current = '';
          continue;
        }
      }
      if (depth > 0) current += ch;
    }

    for (const tuple of tuples) {
      const values = parseTupleValues(tuple);
      if (values.length === cols.length) {
        const obj = {};
        cols.forEach((c, i) => obj[c] = values[i]);
        rows.push(obj);
      }
    }
  }
  return rows;
}

function parseTupleValues(str) {
  const values = [];
  let i = 0;
  while (i < str.length) {
    // Skip whitespace/comma
    while (i < str.length && (str[i] === ' ' || str[i] === ',' || str[i] === '\n' || str[i] === '\r')) i++;
    if (i >= str.length) break;

    if (str[i] === "'") {
      // String value
      i++; // skip opening quote
      let val = '';
      while (i < str.length) {
        if (str[i] === '\\') { val += str[i + 1] || ''; i += 2; continue; }
        if (str[i] === "'") {
          if (str[i + 1] === "'") { val += "'"; i += 2; continue; }
          i++; // skip closing quote
          break;
        }
        val += str[i]; i++;
      }
      values.push(val);
    } else if (str.substring(i, i + 4) === 'NULL') {
      values.push(null);
      i += 4;
    } else {
      // Number or other
      let val = '';
      while (i < str.length && str[i] !== ',' && str[i] !== ')') { val += str[i]; i++; }
      values.push(val.trim());
    }
  }
  return values;
}

function escapeCSV(v) {
  if (!v) return '';
  v = v.replace(/\r\n/g, ' ').replace(/\r/g, ' ').replace(/\n/g, ' ').trim();
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

// --- Parse tables ---
console.log('Parsing SQL dump...');
const licenses = parseInserts(sql, 'licenses');
const users = parseInserts(sql, 'users');
const reviewSettings = parseInserts(sql, 'review_settings');
const vcards = parseInserts(sql, 'vcards');

console.log(`Licenses: ${licenses.length}`);
console.log(`Users: ${users.length}`);
console.log(`Review settings: ${reviewSettings.length}`);
console.log(`vCards: ${vcards.length}`);

// Build maps
const licenseMap = {};
for (const l of licenses) licenseMap[l.id] = l;

// Users with review_settings
const usersWithReview = new Set(reviewSettings.map(r => r.user_id));

// Users with vcards (non-empty) + vcard IDs per user
const usersWithPage = new Set();
const userVcardIds = {};
for (const v of vcards) {
  if (!userVcardIds[v.user_id]) userVcardIds[v.user_id] = [];
  userVcardIds[v.user_id].push(v.id);
  if (v.first_name || v.company_email || v.personal_phone || v.company_phone) {
    usersWithPage.add(v.user_id);
  }
}

// Build CSV rows
const rows = [];
for (const u of users) {
  const license = u.license_id ? licenseMap[u.license_id] : null;
  const firstName = u.name || '';
  const lastName = u.surname || '';
  const email = u.email || '';
  const activityName = license?.notes?.replace(/\r\n/g, ' ').replace(/\r/g, ' ').replace(/\n/g, ' ').trim() || '';
  const authCode = license?.auth_code || '';
  const accountId = license?.id || '';
  const vcardIds = (userVcardIds[u.id] || []).join(' | ');
  const isActive = license?.is_active === '1';

  // Tags
  const tags = ['old'];

  // Services
  if (usersWithReview.has(u.id)) tags.push('review');
  if (usersWithPage.has(u.id)) tags.push('page');

  // Stato
  if (!isActive) tags.push('scaduto');

  // Completamento
  const hasReviewData = usersWithReview.has(u.id);
  const hasPageData = usersWithPage.has(u.id);
  if (hasReviewData || hasPageData) {
    tags.push('completo');
  } else {
    tags.push('da-completare');
  }

  rows.push({
    activityName,
    firstName,
    lastName,
    email,
    authCode,
    accountId,
    vcardIds,
    tags: tags.join(', ')
  });
}

// Sort by activity name
rows.sort((a, b) => a.activityName.localeCompare(b.activityName, 'it'));

// Generate CSV
const header = 'Activity,First Name,Last Name,Email,Auth Code,Account ID,vCard IDs,Tags';
const csvRows = rows.map(r => [
  escapeCSV(r.activityName),
  escapeCSV(r.firstName),
  escapeCSV(r.lastName),
  escapeCSV(r.email),
  escapeCSV(r.authCode),
  escapeCSV(r.accountId),
  escapeCSV(r.vcardIds),
  escapeCSV(r.tags)
].join(','));

const csv = [header, ...csvRows].join('\n');
const outputPath = resolve(__dirname, '../export-legacy-contacts.csv');
writeFileSync(outputPath, csv, 'utf-8');

console.log(`\nCSV esportato: ${outputPath}`);
console.log(`Totale contatti: ${rows.length}`);
console.log(`Con review: ${rows.filter(r => r.tags.includes('review')).length}`);
console.log(`Con page: ${rows.filter(r => r.tags.includes('page')).length}`);
console.log(`Scaduti: ${rows.filter(r => r.tags.includes('scaduto')).length}`);
console.log(`Completi: ${rows.filter(r => r.tags.includes('completo')).length}`);
