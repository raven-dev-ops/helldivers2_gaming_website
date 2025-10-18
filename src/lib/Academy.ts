// src/lib/Academy.ts

export type AcademyModule = {
    id: string;
    title: string;
    subtitle: string;
    img: string;
    imgAlt: string;
    description: string;
    basic: string[];
    advanced: string[];
    details: {
      paragraphs: string[];
      tips?: string[];
      cautions?: string[];
    };
  };
  
  export const MODULES: AcademyModule[] = [
    {
      id: 'environmental',
      title: 'Environmental',
      subtitle: 'Planetary concerns / considerations',
      img: 'https://placehold.co/1200x675?text=Environmental',
      imgAlt: 'Environmental conditions affecting combat',
      description:
        'Understand how biomes, weather, and hazards change your plan of attack and extraction.',
      basic: [
        'Biomes: desert, arctic, forest, swamp; affect visibility, traction, stamina',
        'Weather: sand/blizzards, heavy fog, night; compress effective ranges',
        'Hazards: meteors/artillery, lightning, tremors, acid pools, minefields',
        'Line of sight: dunes, rocks, trees; break sightlines for resets',
        'Extraction terrain: plan clear arcs; avoid low ground and choke points',
      ],
      advanced: [
        'Route planning: pre-mark safeholds, fallback lines, and resupply points',
        'Tempo control: advance between weather waves; kite into natural funnels',
        'Hazard leverage: fight with hazards behind the squad to shred pursuers',
        'Loadout adaption: smoke/flash for low-vis, sentries for lane control',
        'Extraction setup: pre-place mines/sentries; call Pelican early to cycle waves',
      ],
      details: {
        paragraphs: [
          'Environmental factors set the pace. In low visibility (fog, night, blizzards), close-range weapons and area denial excel, while long-range sightlines favor DMRs and turreted play.',
          'Surface hazards can be used offensively. Kite waves across meteor/artillery lanes or through lightning fields to thin numbers before committing anti-armor.',
          'Terrain shapes every encounter. Favor ridgelines and hard cover to break automaton firing arcs and to reset swarm line of sight before re-engaging.',
          'See also: Helldivers 2 Wiki - Environmental Hazards and Biomes for comprehensive lists.',
        ],
        tips: [
          'In blizzards/sandstorms, pop smoke to cross open ground with minimal aggro.',
          'Lightning briefly stuns bots; time pushes or uplink inputs between strikes.',
          'Use uplink buildings and rocks as blast shields when orbitals are active.',
          'Mark safeholds on approach; rotate clockwise so revives stay on the inside arc.',
        ],
        cautions: [
          'Acid pools and craters can cut extract lanes; recon alternates before uplinks.',
          'Meteor showers can delete turrets/objectives if placed in open sky.',
          'Avoid overextending in low-vis; squads desync easily when comms are overloaded.',
        ],
      },
    },
    {
      id: 'weaponry',
      title: 'Weaponry',
      subtitle: 'Types, range, description',
      img: 'https://placehold.co/1200x675?text=Weaponry',
      imgAlt: 'Helldiver weapons on a rack',
      description:
        'Choose the right tool and range for the job; manage recoil, reloads, and armor penetration.',
      basic: [
        'Primaries: AR-23 Liberator (AR), SG-225 Breaker (shotgun), Diligence (DMR)',
        'Energy/Plasma: LAS sustain fire; plasma splash vs clustered light targets',
        'Support AT: Railgun, Recoilless, Autocannon; dedicated armor solutions',
        'Grenades: impact/stun/smoke; control crowds, expose vents, block LOS',
        'Sidearms/utility: reliable finishers; swap instead of reloading under pressure',
      ],
      advanced: [
        'Breakpoints: Chargers - legs; Bile Titans - head/back; Bots - vents/power packs',
        'Stagger vs DPS: prioritize stagger/penetration when kiting heavies over raw damage',
        'Economy: share resupplies; rotate roles when mags deplete; reload behind cover',
        'Synergy: smoke + turreted AT; stun + Railcannon; mines + choke points',
        'Range bands: define lanes so AR/DMR anchor while shotgun flex cleans flanks',
      ],
      details: {
        paragraphs: [
          'Think in roles: Anchor (lane denial), Demo (armor delete), Flex (revives/utility). Your primary fills a gap; your support weapon solves a specific problem.',
          'Armor categories demand dedicated counters. Build one-tap options for vents/weak points and reliable stuns for resets when things snowball.',
          'See also: Helldivers 2 Wiki - Weapons, Equipment, and Damage for stats and behaviors.',
        ],
        tips: [
          'Railgun (unsafe mode) can pierce vents through soft cover when timed well.',
          'Autocannon behind smoke lets you turret safely across open ground.',
          'Use impact grenades to pop bot vents from the side without overexposing.',
          'Practice partial reloads and fast swaps instead of panic full reloads.',
        ],
        cautions: [
          'Breaker has a wide friendly-fire cone; call pushes and avoid shoulder shooting.',
          'Do not tunnel on heavies while spawners/artillery are active.',
        ],
      },
    },
    {
      id: 'armory',
      title: 'Armory',
      subtitle: 'Types, range, description',
      img: 'https://placehold.co/1200x675?text=Armory',
      imgAlt: 'Helldiver armor sets on mannequins',
      description:
        'Balance protection and mobility; pick armor that matches your role and mission.',
      basic: [
        'Classes: Light (mobility), Medium (balanced), Heavy (survivability/utility)',
        'Mobility & stamina: heavier suits slow sprint and recovery windows',
        'Backpacks: Ammo, Shield, Support AT; align to squad gaps',
        'Grenade pairing: smoke/impact/frag depending on faction and terrain',
      ],
      advanced: [
        'Role gearing: Demo (AT), Anchor (lane hold), Flex (revive/utility)',
        'Mitigation: plan for friendly fire and orbital splash around objectives',
        'Team comp: ensure two independent AT answers for armor spikes',
        'Objective bias: heavier suits for static holds; light for map control',
      ],
      details: {
        paragraphs: [
          'Heavier kits excel when objectives force static play (uplinks, samples, extracts). Light kits shine on mobile missions where spacing and resets matter most.',
          'Backpack choice changes your fail states: ammo for economy, shield for clutch revives, AT for independence. Fit to the mission and squad comfort.',
          'See also: Helldivers 2 Wiki - Armor and Equipment overviews for set traits and usage.',
        ],
        tips: [
          'Heavy + shield backpack provides a critical buffer during chaotic extracts.',
          'Carry utility grenades on anchors; flex players carry stuns/smokes.',
          'Swap armor bias if the planet is hazard-heavy (meteors/lightning).',
        ],
        cautions: [
          'Do not over-stack heavy suits; squad mobility collapses under meteor spam.',
          'Avoid mixed move-speeds without plan; spacing breaks and revives suffer.',
        ],
      },
    },
    {
      id: 'stratagems',
      title: 'Stratagems',
      subtitle: 'Type, warnings, advantage',
      img: 'https://placehold.co/1200x675?text=Stratagems',
      imgAlt: 'Stratagem beacons being thrown',
      description:
        'Call down the right support at the right time while managing risk to your squad.',
      basic: [
        'Categories: Offensive (Eagle/Orbitals), Defensive (Sentries/Mines), Utility (Resupply/Shield)',
        'Announce throws: clear teammates from danger zones before impact',
        'Use cover: ridges/walls to block blast, shrapnel, and turret fire',
        'Resupply discipline: share and rotate; avoid double calls under stress',
      ],
      advanced: [
        'Combos: stun + Railcannon; smoke + uplinks; barrages to shape extracts',
        'Sentry placement: behind cover, overlapping arcs, out of friendly lanes',
        'Cooldown rhythm: precast Eagles; stagger orbitals to maintain pressure',
        'Spawner suppression: pre-call strafes on bot drops/spawner pings',
      ],
      details: {
        paragraphs: [
          'Treat orbitals like deployable terrain. You are shaping where enemies can stand, then exploiting forced paths with anti-armor and overlapping fire.',
          'Keep the initiative: pre-call Eagle runs on spawner pings and time resupplies between waves so objectives are not interrupted.',
          'See also: Helldivers 2 Wiki - Stratagems for inputs, cooldowns, and effects.',
        ],
        tips: [
          'Mortar sentry behind a low wall provides safe, sustained suppression.',
          'Minefields at the edge of your extract arc punish flanks without friendly risk.',
          'Throw smoke on sentry positions to reduce bot accuracy across open fields.',
        ],
        cautions: [
          'Announce precision/large orbitals. Blue-on-blue wipes are avoidable with a 2s call.',
          'Avoid dropping sentries in friendly lanes; place off-angle behind cover.',
        ],
      },
    },
    {
      id: 'xenology',
      title: 'Xenology',
      subtitle: 'Race, armor type, weakness, strengths',
      img: 'https://placehold.co/1200x675?text=Xenology',
      imgAlt: 'Enemy faction silhouettes',
      description:
        'Know your enemy: identify armor types, behaviors, and the counters that work.',
      basic: [
        'Factions: Terminids (melee swarms) and Automatons (ranged, armored units)',
        'Weak points: Charger legs; Bile Titan head/back; bot vents/power units',
        'Spawner/commander control: kill these first to reduce pressure',
        'Behavior: bugs rush lanes; bots take and hold angles with ranged fire',
      ],
      advanced: [
        'Counters: AT vs Chargers/Tanks; EMP/impact vs bots; fire vs bugs',
        'Triage: artillery, snipers, breeders before fodder; starve waves at source',
        'CC vs single-target: swap roles as threats evolve during the fight',
        'Dropships: pre-call orbitals on bot drops; mine their landing arcs',
      ],
      details: {
        paragraphs: [
          'Terminids reward kiting into funnels, fire DoTs, and sentry-lane control. Keep moving and reset line of sight often to avoid surround wipes.',
          'Automatons demand strict cover discipline and angle denial. Use smoke, terrain, and flanks to pop vents and power units safely.',
          'See also: Helldivers 2 Wiki - Enemies and Factions for unit specifics and weak point diagrams.',
        ],
        tips: [
          'Impact grenades pop bot vents from side angles without overexposing.',
          'Bile Titans take heavy damage from head/back; draw fire into AT arcs.',
          'Pre-mine breeder approaches; do not chase into fog and low-visibility zones.',
        ],
        cautions: [
          'Do not tunnel vision heavies while spawners are active; you will get overrun.',
          'Avoid straight-line pushes vs bots; they punish predictable angles.',
        ],
      },
    },
    {
      id: 'command',
      title: 'Command',
      subtitle: 'Roles, duties, applications',
      img: 'https://placehold.co/1200x675?text=Command',
      imgAlt: 'Command roles and responsibilities',
      description:
        'Understand GPT Fleet leadership roles and how to step up: Fleet Commander (jr. mod), Democracy Officer (mod), Loyalty Officer (admin).',
      basic: [
        'Fleet Commander: squad/event ops, quick decisions, escalates issues',
        'Democracy Officer: moderation, culture enforcement, event leads',
        'Loyalty Officer: admin, policy, security, final arbitration',
        'Comms: brevity words, standard callouts, confirm-by-echo',
      ],
      advanced: [
        'Playbooks: incident triage -> de-escalation -> resolution -> report',
        'Signal: concise directives; delegate early to maintain tempo',
        'Pipeline: apply via Mod Team; shadow, evaluate, then promote',
        'After-action: short write-ups cement lessons and improve processes',
      ],
      details: {
        paragraphs: [
          'Command roles keep games moving and culture consistent. Use clear comms, set tempo, and assign roles so the squad always knows the next action.',
          'Document incidents: what happened, who was impacted, immediate action, and follow-ups. Consistency builds trust across the community.',
        ],
        tips: [
          'Use standard callouts ("Rotate north", "Hold extract", "AT on Charger legs").',
          'Keep an event bench; backfill proactively to avoid burnout and gaps.',
          'End runs with quick AARs (30-60s) to reinforce what worked.',
        ],
        cautions: [
          'Avoid rules lawyering mid-match; stabilize first, debrief after.',
          'Promotions follow performance and culture fit; no fast-tracking.',
        ],
      },
    },
  ];
  
  export const getModules = async (): Promise<AcademyModule[]> => MODULES;
  