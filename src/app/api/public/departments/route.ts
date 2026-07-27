import { NextResponse } from 'next/server';

const departments = [
  {
    title: 'Office of the Administrator',
    divisions: [
      { name: 'The Administrator', description: 'Supreme authority over all Site-92 operations. The Administrator has final say on all containment decisions, personnel assignments, and facility-wide directives.' },
      { name: 'O5 Council Liaison', description: 'The on-site representative of the O5 Council. Relays Council directives to Site-92 command staff and provides periodic reports on facility status.' },
      { name: 'Ethics Committee', description: 'Reviews and approves or denies research proposals and containment procedures on ethical grounds. Has the authority to halt any test.' },
      { name: 'DFIIC — Directorate of Foundation Integrity and Internal Compliance', description: 'Manages internal compliance, integrity investigations, and counter-espionage. Identifies potential security compromises within Foundation personnel and monitors Groups of Interest activity.' },
      { name: 'DSAO — Department of Site Administration & Oversight', description: 'Coordinates site administration, oversight of all departments, specialized containment operations, and emergency response scenarios requiring unconventional approaches.' },
    ],
  },
  {
    title: 'Department of Containment',
    divisions: [
      { name: 'Low Containment Operations', description: 'Manages Safe-class anomalies and supervised entities. Handles SCP-034 and SCP-066.' },
      { name: 'Moderate Containment', description: 'Oversees Euclid-class anomalies requiring active monitoring. Contains SCP-049, SCP-457, and SCP-173.' },
      { name: 'Biological Containment', description: 'Specialized biosafety containment for anomalous pathogens. Houses SCP-008, SCP-016, SCP-610, and SCP-409. Full hazmat protocols in effect.' },
      { name: 'Heavy Containment', description: 'Maximum security containment for Keter-class anomalies. Contains SCP-682, SCP-939, SCP-035, SCP-096, and SCP-002. Armed MTF escort required.' },
      { name: 'Thaumiel Research', description: 'Studies and deploys Thaumiel-class anomalies used to counteract or contain other SCP objects. Highly classified.' },
    ],
  },
  {
    title: 'Department of Engineering & Technician (E&T)',
    divisions: [
      { name: 'Manufacturing Division', description: 'Designs and manufactures specialized containment equipment, Scranton Anchor components, and custom tools required for anomaly handling.' },
      { name: 'Core Scientist', description: 'Lead researchers responsible for anomaly analysis, containment theory, and the development of new containment methodologies.' },
      { name: 'Logistics Technician', description: 'Manages supply chains, equipment transport, hazardous material handling, and the coordination of resources between sectors.' },
      { name: 'Maintenance Crew Division', description: 'Maintains and repairs all facility infrastructure including containment chambers, Scranton Anchors, power systems, and structural integrity.' },
    ],
  },
  {
    title: 'Site Internal Security',
    divisions: [
      { name: 'SSF — Site Security Force', description: 'Primary internal security force. Patrols sectors, manages access control, responds to disturbances, and provides armed escort for high-risk containment procedures.' },
      { name: 'E.T.T.R.A — Emergency Threat Tactical Response Authority', description: 'Elite tactical response unit activated during containment breaches, hostile entity incursions, and facility-wide emergencies. Operates under direct authority of the Site Director.' },
    ],
  },
  {
    title: 'Mobile Task Forces',
    divisions: [
      { name: 'Alpha-1 "Red Right Hand"', description: 'Directly commanded by the O5 Council. Handles operations requiring the highest security clearance.' },
      { name: 'Beta-7 "Maz Hatters"', description: 'Specializes in the containment and investigation of anomalous chemical and biological agents.' },
      { name: 'Epsilon-11 "Nine-Tailed Fox"', description: 'Site-92 primary response team. Handles internal security breaches and containment failures.' },
      { name: 'Eta-10 "See No Evil"', description: 'Specializes in visual and sensory cognitohazard containment. Trained to operate under perceptual suppression.' },
      { name: 'Nu-7 "Hammer Down"', description: 'Heavy assault and suppression task force. Deployed when conventional containment fails.' },
      { name: 'Tau-1 "Samsara"', description: 'Cyborg task force utilizing advanced cybernetic augmentation and memory transfer. Designated for SCP-096 containment and pursuit operations. Capable of sustained operations in hostile anomalous environments.' },
    ],
  },
  {
    title: 'Factions',
    divisions: [
      { name: 'FBI — Unusual Incidents Unit (UIU)', description: 'The FBI\'s anomalous investigations division. Maintains a cooperative relationship with the Foundation. Handles domestic anomalous incidents within the United States.' },
      { name: 'Lambda-12 "Pest Control"', description: 'Anomalous pest and wildlife eradication faction. Deals with self-replicating biological anomalies, infestations, and ecological anomalies. Operates semi-independently.' },
    ],
  },
];

export async function GET() {
  try {
    return NextResponse.json(departments);
  } catch (error) {
    console.error('Public GET departments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}
