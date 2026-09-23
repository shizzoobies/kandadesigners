/* Fictional practice scenarios carried forward from the reviewed lesson. */
window.safetyActivityData = {
  "controls": [
    {
      "id": "h1",
      "title": "Reroute the drain",
      "scenario": "A trench has to be cut through a finished slab to reach a drain line. The design team confirms the line can be rerouted overhead instead, on the same schedule and with the same result.",
      "action": "Reroute the line overhead",
      "level": "Elimination",
      "art": "assets/img/activity-h1.svg",
      "feedback": "Elimination. Rerouting removes this cutting task and its associated exposure. Assess the new route too: other hazards may still need controls."
    },
    {
      "id": "h2",
      "title": "Tool-cleaning room",
      "scenario": "A crew cleans tools with a strong solvent in a small room. A water-based cleaner does the same job and has been assessed as less hazardous for this task.",
      "action": "Swap to the assessed cleaner",
      "level": "Substitution",
      "art": "assets/img/activity-h2.svg",
      "feedback": "Substitution. Same task, same tools, less harmful material. The room does not change and the crew does not change, so the swap holds even when nobody is watching."
    },
    {
      "id": "h3",
      "title": "Indoor block cutting",
      "scenario": "Workers are cutting concrete block indoors and dust is filling the room. The cuts are field fits, so the pieces cannot be ordered pre-cut.",
      "action": "Control dust at its source",
      "level": "Engineering controls",
      "art": "assets/img/activity-h3.svg",
      "feedback": "Engineering controls reduce dust at its source. Use the task-specific controls, work practices and any respiratory protection required by the silica exposure-control plan."
    },
    {
      "id": "h4",
      "title": "Open second-floor edge",
      "scenario": "An open edge runs along the second floor where crews cross all day. The edge is part of the building and it is going to be there for the next three months.",
      "action": "Install a physical barrier",
      "level": "Engineering controls",
      "art": "assets/img/activity-h4.svg",
      "feedback": "Engineering controls. A guardrail is a physical barrier that works whether or not anybody is thinking about the edge, and it protects the person who is walking backwards carrying a sheet of plywood."
    },
    {
      "id": "h5",
      "title": "Shared stairwell",
      "scenario": "Two crews need the same stairwell: one running conduit overhead from a platform, one carrying material up. The stairwell is the only route and neither crew can move.",
      "action": "Separate the crews in time",
      "level": "Administrative controls",
      "art": "assets/img/activity-h5.svg",
      "feedback": "Administrative controls. Neither crew can move and the stairwell cannot be changed, so the control is sequencing: separate the two in time, and make the split a named responsibility rather than a hope."
    },
    {
      "id": "h6",
      "title": "Screened grinding bay",
      "scenario": "A welder is grinding in a screened bay with local exhaust running and nobody else in the area. The sparks and the noise are as contained as the setup can make them.",
      "action": "Add task-matched protective equipment",
      "level": "Protective equipment",
      "art": "assets/img/activity-h6.svg",
      "feedback": "Protective equipment. Everything above it has already been done: the work is screened, exhausted and isolated. Face and hearing protection is the honest last layer here, not a shortcut."
    }
  ],
  "findings": [
    {
      "id": "g1",
      "title": "Access ladder",
      "description": "The access ladder is in good condition, set at the correct angle on a firm base, secured, and its side rails extend at least 3 feet above the landing.",
      "hold": false,
      "art": "assets/img/activity-g1.svg",
      "feedback": "Go for the conditions described: good condition, correct angle, firm base, secured, and side rails at least 3 feet above the landing."
    },
    {
      "id": "g2",
      "title": "Wet walkway",
      "description": "A cord feeding a work light runs across the main walkway and sits in the puddle at the low spot.",
      "hold": true,
      "art": "assets/img/activity-g2.svg",
      "feedback": "Stop. Keep people clear. Do not touch the cord or enter the water. Have an authorized person make the supply safe before inspection or rerouting."
    },
    {
      "id": "g3",
      "title": "Floor opening",
      "description": "A floor-hole cover is verified to support at least twice the combined load that may be imposed. It is secured against displacement and clearly marked COVER.",
      "hold": false,
      "art": "assets/img/activity-g3.svg",
      "feedback": "Go for the stated conditions: the cover has verified load capacity, is secured against displacement, and is clearly marked."
    },
    {
      "id": "g4",
      "title": "Delivery edge",
      "description": "A guardrail section was taken out to land material, and the crew left for lunch with the edge open.",
      "hold": true,
      "art": "assets/img/activity-g4.svg",
      "feedback": "Stop. Prevent access to the exposed area until compliant fall protection is restored. An unattended open edge cannot wait until the end of the shift."
    },
    {
      "id": "g5",
      "title": "Overhead work",
      "description": "A worker is grinding overhead in eye protection while another crosses underneath with nothing on their head.",
      "hold": true,
      "art": "assets/img/activity-g5.svg",
      "feedback": "Stop. Eye protection covers the grinder, not the person underneath. Either the crossing stops or the overhead work stops, and either way somebody puts a hard hat on."
    },
    {
      "id": "g6",
      "title": "Housekeeping route",
      "description": "Bins are set at each work area. The current walk-through confirms the walkways remain clear, with debris removed as work continues.",
      "hold": false,
      "art": "assets/img/activity-g6.svg",
      "feedback": "Go for the conditions described: the current inspection confirms clear routes, with debris removed as work continues."
    },
    {
      "id": "g7",
      "title": "Electrical panel",
      "description": "Before panel work, the required energy-control procedure is complete. A qualified person has verified exposed parts are deenergized and addressed stored energy and other sources.",
      "hold": false,
      "art": "assets/img/activity-g7.svg",
      "feedback": "Go for the stated conditions: the required procedure is complete, and a qualified person has verified exposed parts are deenergized and addressed other energy sources."
    },
    {
      "id": "g8",
      "title": "Emergency exit",
      "description": "Block is stacked chest high on the walkway, directly in front of the marked exit door.",
      "hold": true,
      "art": "assets/img/activity-g8.svg",
      "feedback": "Stop. Move it now. Exits get blocked because they are convenient, and they get discovered on the one day nobody has a minute to spare."
    }
  ]
};
