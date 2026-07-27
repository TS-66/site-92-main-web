import { NextResponse } from 'next/server';

const departments = [
  {
    title: 'Office of the Administrator',
    divisions: [
      { name: 'The Administrator', description: 'Supreme authority over all Site-92 operations. The Administrator has final say on all containment decisions, personnel assignments, and facility-wide directives. Reports directly to the O5 Council.' },
      { name: 'O5 Council Liaison', description: 'The on-site representative of the O5 Council. Relays Council directives to Site-92 command staff and provides periodic reports on facility status, anomaly activity, and incident resolution.' },
      { name: 'Ethics Committee', description: 'Reviews and approves or denies research proposals and containment procedures on ethical grounds. Balances security necessities with moral responsibility. Has the authority to halt any test.' },
      { name: 'DFIIC — Department of Field Intelligence & Internal Control', description: 'Manages intelligence operations, internal security investigations, and counter-espionage. Identifies potential security compromises within Foundation personnel and monitors Groups of Interest activity.' },
      { name: 'DSAO — Department of Special Anomalous Operations', description: 'Coordinates specialized containment operations that fall outside standard protocols. Handles cross-SCP interactions, high-risk testing, and emergency response scenarios requiring unconventional approaches.' },
    ],
  },
  {
    title: 'Department of Containment',
    divisions: [
      { name: 'Low Containment Operations', description: 'Manages Safe-class anomalies and supervised entities. Handles day-to-day containment of lower-risk SCPs including SCP-034 and SCP-066.' },
      { name: 'Moderate Containment', description: 'Oversees Euclid-class anomalies requiring active monitoring. Contains SCP-049, SCP-457, and SCP-173. Staff must maintain constant vigilance.' },
      { name: 'Biological Containment', description: 'Specialized biosafety containment for anomalous pathogens and organisms. Houses SCP-008, SCP-016, SCP-610, and SCP-409. Full hazmat protocols in effect at all times.' },
      { name: 'Heavy Containment', description: 'Maximum security containment for Keter-class and high-threat anomalies. Contains SCP-682, SCP-939, SCP-035, SCP-096, and SCP-002. Armed MTF escort required for all entries.' },
      { name: 'Thaumiel Research', description: 'Studies and deploys Thaumiel-class anomalies used to counteract or contain other SCP objects. Highly classified operations. Access requires O5 authorization.' },
    ],
  },
  {
    title: 'Department of Research',
    divisions: [
      { name: 'Anomalous Physics', description: 'Investigates violations of known physical laws. Studies reality-bending anomalies, spatial distortions, and non-Euclidean geometries.' },
      { name: 'Biohazard Studies', description: 'Handles biological anomalies including anomalous organisms, pathogens, and genetic mutations. Operates under strict biosafety Level-4 protocols.' },
      { name: 'Memetics & Cognitohazards', description: 'Researches information-based anomalies that affect perception, memory, and cognition. Develops counter-memetic defenses for Foundation personnel.' },
      { name: 'Temporal Anomalies', description: 'Investigates time-related anomalies including temporal loops, causal disruptions, and objects exhibiting non-linear temporal properties.' },
    ],
  },
  {
    title: 'Mobile Task Forces',
    divisions: [
      { name: 'Alpha-1 "Red Right Hand"', description: 'Directly commanded by the O5 Council. Handles operations requiring the highest security clearance and utmost discretion.' },
      { name: 'Beta-7 "Maz Hatters"', description: 'Specializes in the containment and investigation of anomalous chemical and biological agents. Full hazmat deployment capability.' },
      { name: 'Epsilon-11 "Nine-Tailed Fox"', description: 'Site-92 primary response team. Handles internal security breaches, containment failures, and mass casualty events within Foundation facilities.' },
      { name: 'Eta-10 "See No Evil"', description: 'Specializes in the handling and containment of visual and sensory cognitohazards. Trained to operate under perceptual suppression.' },
      { name: 'Nu-7 "Hammer Down"', description: 'Heavy assault and suppression task force. Deployed when conventional containment fails and forceful re-establishment of control is required.' },
      { name: 'Tau-5 "Samsara"', description: 'Cyborg task force utilizing advanced cybernetic augmentation and memory transfer. Capable of sustained operations in hostile anomalous environments.' },
    ],
  },
  {
    title: 'Department of Engineering',
    divisions: [
      { name: 'Scranton Anchor Maintenance', description: 'Maintains and repairs Scranton Reality Anchors across all Foundation sites. Critical for containing reality-bending anomalies.' },
      { name: 'Power Systems', description: 'Manages the complex power infrastructure required by Foundation facilities, including backup systems and anomalous power sources.' },
      { name: 'Containment Architecture', description: 'Designs and constructs specialized containment chambers, vaults, and facilities tailored to the requirements of individual anomalies.' },
      { name: 'IT & SCiPNET', description: 'Maintains the Foundation\'s secure intranet, SCiPNET terminal systems, and all digital infrastructure. Protects against information-based anomalous threats.' },
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
