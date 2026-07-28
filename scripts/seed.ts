import { PrismaClient } from '../node_modules/@prisma/client/index.js';

const db = new PrismaClient();

async function main() {
  await db.siteStatus.createMany({ data: [
    { key: 'SITE_ALERT', value: '' },
    { key: 'CODE_BLACK', value: 'STANDBY' },
    { key: 'CODE_RED', value: 'STANDBY' },
    { key: 'FACILITY', value: 'OPERATIONAL' },
    { key: 'POWER', value: '100%' },
    { key: 'TEMPERATURE', value: '22°C' },
    { key: 'PERSONNEL', value: '127' },
    { key: 'ANOMALIES', value: '4' },
  ]});

  await db.siteScp.createMany({ data: [
    { scpId: 'SCP-999', name: 'The Tickle Monster', objectClass: 'Safe', threat: 'Low', zone: 'LOW_CONTAINMENT', description: 'A telepathic gelatinous creature that induces euphoria in nearby personnel. Often used for stress relief among staff.', addedBy: 'SYSTEM' },
    { scpId: 'SCP-173', name: 'The Sculpture', objectClass: 'Euclid', threat: 'High', zone: 'MODERATE_CONTAINMENT', description: 'A concrete statue that moves only when not observed. Snaps the neck of any living creature within range when unobserved.', addedBy: 'SYSTEM' },
    { scpId: 'SCP-049', name: 'The Plague Doctor', objectClass: 'Euclid', threat: 'High', zone: 'MODERATE_CONTAINMENT', description: 'A humanoid entity resembling a medieval plague doctor. Believes humans carry the "Pestilence" and attempts to "cure" them via touch, which kills them.', addedBy: 'SYSTEM' },
    { scpId: 'SCP-682', name: 'Hard-to-Destroy Reptile', objectClass: 'Keter', threat: 'Critical', zone: 'HEAVY_CONTAINMENT', description: 'A highly aggressive, intelligent reptilian entity that recovers from any damage. Hostile to all life. Constant containment efforts required.', addedBy: 'SYSTEM' },
    { scpId: 'SCP-096', name: 'The Shy Guy', objectClass: 'Euclid', threat: 'High', zone: 'HEAVY_CONTAINMENT', description: 'A humanoid entity that becomes extremely aggressive when its face is viewed. Will hunt down and kill anyone who has seen its face, regardless of distance.', addedBy: 'SYSTEM' },
  ]});

  await db.testLog.createMany({ data: [
    { scpRef: 'SCP-999', title: 'Exposure Response Test', researchers: 'Dr. Crown', result: 'Subject reports uncontrollable laughter and overwhelming sense of joy. Test successful.', severity: 'MINOR', addedBy: 'SYSTEM' },
    { scpRef: 'SCP-173', title: 'Blink Rate Observation', researchers: 'Dr. Grant, Dr. Haines', result: 'Continuous visual contact required. Any visual gap results in immediate relocation. Hazard remains critical.', severity: 'MAJOR', addedBy: 'SYSTEM' },
    { scpRef: 'SCP-049', title: 'Touch Cytology Analysis', researchers: 'Dr. Kingsley', result: 'Tissue samples from touched subjects show rapid cellular necrosis. "Cure" is fatal. No antidote found.', severity: 'CRITICAL', addedBy: 'SYSTEM' },
  ]});

  await db.siteProtocol.createMany({ data: [
    { code: 'PROTOCOL-001', name: 'Containment Breach Response', target: 'SITE-WIDE', status: 'ACTIVE', assignedTo: 'MTF Epsilon-11', description: 'Standard protocol for any containment breach event. All personnel to evacuation stations.' },
    { code: 'PROTOCOL-002', name: 'Biohazard Lockdown', target: 'BIO_ZONE', status: 'STANDBY', assignedTo: 'Medical Team Alpha', description: 'Activates bio-seal on biological containment wing. All airlocks cycle to safe mode.' },
    { code: 'PROTOCOL-003', name: 'Memory Wipe Procedure', target: 'SITE-WIDE', status: 'STANDBY', assignedTo: 'Amnestic Division', description: 'Class-A amnestic deployment for civilian exposure events. Post-deployment debrief required.' },
    { code: 'PROTOCOL-004', name: 'Power Failure Backup', target: 'SITE-WIDE', status: 'STANDBY', assignedTo: 'Engineering', description: 'Diesel generators engage within 30s of mains loss. All containment locks on UPS.' },
  ]});

  await db.incident.createMany({ data: [
    { code: 'INC-2025-0412', title: 'Containment Cell Crack in Sector B-7', severity: 'HIGH', sector: 'B-WING', description: 'Routine inspection revealed structural crack in SCP-173 cell wall. Cell evacuated pending reinforcement.', status: 'ACTIVE', reportedBy: 'Dr. Haines' },
    { code: 'INC-2025-0388', title: 'Personnel Exposure to SCP-049', severity: 'CRITICAL', sector: 'MED-WING', description: 'Two D-Class exposed during routine interview. Both terminated post-exposure. Area sterilized.', status: 'RESOLVED', reportedBy: 'Dr. Kingsley' },
    { code: 'INC-2025-0271', title: 'Camera Malfunction in Heavy Containment', severity: 'MODERATE', sector: 'HC-WING', description: 'Camera feed lost in SCP-682 chamber for 4.7 seconds. Manual check confirmed containment intact.', status: 'RESOLVED', reportedBy: 'Security Team 4' },
    { code: 'INC-2025-0193', title: 'Unauthorized Access to Terminal', severity: 'LOW', sector: 'COMMAND', description: 'Junior researcher attempted to access Level 4 files without clearance. Account suspended pending review.', status: 'RESOLVED', reportedBy: 'System Auto-Flag' },
    { code: 'INC-2025-0518', title: 'Power Fluctuation in Low Containment', severity: 'MODERATE', sector: 'LC-WING', description: 'Voltage spike caused brief lighting failure in SCP-999 chamber. SCP-999 unaffected. Backup power restored in 8s.', status: 'ACTIVE', reportedBy: 'Engineering' },
  ]});

  await db.newsItem.createMany({ data: [
    { tag: 'info', title: 'Q3 Personnel Review Complete', body: 'All personnel have been evaluated. Performance bonuses to be distributed next cycle. Outstanding contributions recognized in three departments.', author: "Director's Office" },
    { tag: 'warning', title: 'Scheduled Maintenance Window', body: 'SCiPNET will undergo scheduled maintenance on Sunday 02:00-04:00 UTC. Brief service interruptions expected during this window.', author: 'Engineering Division' },
    { tag: 'critical', title: 'CODE BLACK Drill This Friday', body: 'A site-wide CODE BLACK drill will occur Friday 14:00. All personnel must report to designated evacuation stations. Drill duration: 22 minutes.', author: 'Site Command' },
    { tag: 'info', title: 'New MTF Squad Deployed', body: 'MTF Lambda-12 "Pest Controllers" has been assigned to Site-92 for biohazard response. Welcoming them to the facility.', author: 'Operations' },
  ]});

  await db.credential.createMany({ data: [
    { username: 'ADMIN', password: 'O5-X927' },
    { username: 'AGENT', password: 'DELTA9' },
    { username: 'TEST', password: 'TEST' },
  ]});

  console.log('Seed complete');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
