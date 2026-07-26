import { NextResponse } from 'next/server';

const departments = [
  {
    title: 'Department of Containment',
    divisions: [
      { name: 'Euclid Operations', description: 'Management and oversight of Euclid-class anomalies requiring active containment procedures and continuous monitoring protocols.' },
      { name: 'Keter Containment', description: 'Dedicated to the most dangerous and unpredictable anomalies. Implements multi-layered containment strategies with redundant fail-safes.' },
      { name: 'Safe-Class Storage', description: 'Archival and secure storage of Safe-class objects. Maintains long-term containment vaults and periodic review schedules.' },
      { name: 'Thaumiel Research', description: 'Studies and deploys Thaumiel-class anomalies used to counteract or contain other SCP objects. Highly classified operations.' },
    ],
  },
  {
    title: 'Department of Research',
    divisions: [
      { name: 'Anomalous Physics', description: 'Investigates violations of known physical laws. Studies reality-bending anomalies, spatial distortions, and non-Euclidean geometries.' },
      { name: 'Biohazard Studies', description: 'Handles biological anomalies including anomalous organisms, pathogens, and genetic mutations. Operates under strict biosafety protocols.' },
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
      { name: 'Lambda-12 "Pest Control"', description: 'Deals with anomalous pest infestations and biological swarm events. Expertise in containing self-replicating biological anomalies.' },
      { name: 'Nu-7 "Hammer Down"', description: 'Heavy assault and suppression task force. Deployed when conventional containment fails and forceful re-establishment of control is required.' },
      { name: 'Tau-5 "Samsara"', description: 'Cyborg task force utilizing advanced cybernetic augmentation and memory transfer. Capable of sustained operations in hostile anomalous environments.' },
    ],
  },
  {
    title: 'Department of Security',
    divisions: [
      { name: 'Site Defense', description: 'Protects Foundation facilities from external threats including hostile Groups of Interest, raids, and anomalous incursions.' },
      { name: 'Internal Affairs', description: 'Investigates security breaches, employee misconduct, and potential compromises within Foundation personnel.' },
      { name: 'Perimeter Control', description: 'Manages access control, surveillance systems, and the layered security perimeters surrounding all Foundation sites and facilities.' },
      { name: 'D-Class Management', description: 'Oversees the procurement, housing, and deployment of D-Class personnel for testing and containment procedures involving human subjects.' },
    ],
  },
  {
    title: 'O5 Council',
    divisions: [
      { name: 'Strategic Oversight', description: 'The O5 Council provides ultimate authority over all Foundation operations. Sets containment priorities and approves large-scale resource allocation.' },
      { name: 'Ethics Committee', description: 'Reviews and approves or denies research proposals and containment procedures on ethical grounds. Balances security with moral responsibility.' },
      { name: 'External Affairs', description: 'Manages the Foundation\'s relationship with governments, other organizations, and Groups of Interest. Coordinates cover stories and misinformation campaigns.' },
      { name: 'Amnestic Production', description: 'Oversees the development, manufacturing, and deployment of amnestic agents used in maintaining the veil of secrecy around Foundation operations.' },
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