// js/data.js
// Static bird data. All British / NE Atlantic species.
// Schema: [englishName, genus, species, imageUrl (Wikimedia CC), funFact]
// imageUrl intentionally kept as fallback — birds.json (GitHub Action) overrides rec at runtime.

const BIRDS = [
  // ── Auks ──────────────────────────────────────────────────────────────────
  ["Atlantic Puffin",
   "Fratercula", "arctica",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Rjdeadly_puffin.jpg/640px-Rjdeadly_puffin.jpg",
   "Puffins can hold up to 62 sand eels crosswise in their bill at once, thanks to a specially hinged jaw and backward-pointing tongue spines."],

  ["Razorbill",
   "Alca", "torda",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Razorbill_-_Machias_Seal_Island.jpg/640px-Razorbill_-_Machias_Seal_Island.jpg",
   "Razorbills are monogamous and often pair for life, returning to the same cliff ledge each breeding year."],

  ["Common Guillemot",
   "Uria", "aalge",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Guillemot_arp.jpg/640px-Guillemot_arp.jpg",
   "Guillemot eggs are pyriform (pear-shaped) so they spin in an arc rather than rolling off cliff ledges."],

  ["Black Guillemot",
   "Cepphus", "grylle",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Cepphus_grylle_2.jpg/640px-Cepphus_grylle_2.jpg",
   "Unlike most auks, Black Guillemots rarely venture far from shore and nest in coastal rock crevices and stone walls."],

  ["Little Auk",
   "Alle", "alle",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Alle_alle_edit.jpg/640px-Alle_alle_edit.jpg",
   "Little Auks breed in the high Arctic in colonies of millions, but winter at sea off British coasts, easily missed in rough weather."],

  // ── Gannets & Cormorants ──────────────────────────────────────────────────
  ["Northern Gannet",
   "Morus", "bassanus",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Gannets_on_Bass_Rock.jpg/640px-Gannets_on_Bass_Rock.jpg",
   "Gannets plunge-dive at over 100 km/h and have no external nostrils; impact is absorbed by subcutaneous air sacs."],

  ["European Shag",
   "Gulosus", "aristotelis",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Phalacrocorax_aristotelis_1_%28Marek_Szczepanek%29.jpg/640px-Phalacrocorax_aristotelis_1_%28Marek_Szczepanek%29.jpg",
   "Shags have no waterproofing oil and must spread their wings to dry after diving — a posture known as 'wing-spreading'."],

  ["Great Cormorant",
   "Phalacrocorax", "carbo",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Phalacrocorax_carbo_01.jpg/640px-Phalacrocorax_carbo_01.jpg",
   "Great Cormorants were trained by fishermen in China and Japan over 1,400 years ago — the practice still continues ceremonially today."],

  // ── Petrels & Shearwaters ─────────────────────────────────────────────────
  ["Manx Shearwater",
   "Puffinus", "puffinus",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Manx-Shearwater.jpg/640px-Manx-Shearwater.jpg",
   "Manx Shearwaters navigate back to their home burrow from 5,000 km with near-perfect accuracy and can live over 50 years."],

  ["Sooty Shearwater",
   "Ardenna", "grisea",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Sooty_Shearwater.jpg/640px-Sooty_Shearwater.jpg",
   "Sooty Shearwaters undertake one of the longest migrations of any bird — a figure-of-eight circuit of the entire Pacific Ocean."],

  ["Balearic Shearwater",
   "Puffinus", "mauretanicus",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Puffinus_mauretanicus.jpg/640px-Puffinus_mauretanicus.jpg",
   "The Balearic Shearwater is Critically Endangered — the entire world population breeds only in the Balearic Islands."],

  ["European Storm Petrel",
   "Hydrobates", "pelagicus",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/European_Storm_Petrel.jpg/640px-European_Storm_Petrel.jpg",
   "Storm Petrels 'walk' on the water surface while feeding, leading sailors to name them after St Peter."],

  ["Leach's Storm Petrel",
   "Hydrobates", "leucorhous",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Leachs_storm_petrel.jpg/640px-Leachs_storm_petrel.jpg",
   "Leach's Storm Petrels have a deeply forked tail and an erratic, bounding flight quite unlike any other British seabird."],

  ["Northern Fulmar",
   "Fulmarus", "glacialis",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Fulmarus_glacialis_1_%28Marek_Szczepanek%29.jpg/640px-Fulmarus_glacialis_1_%28Marek_Szczepanek%29.jpg",
   "Fulmars defend their nest by projectile-vomiting a foul-smelling stomach oil up to a metre at intruders."],

  // ── Skuas ─────────────────────────────────────────────────────────────────
  ["Great Skua",
   "Stercorarius", "skua",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Great_Skua_at_Handa.jpg/640px-Great_Skua_at_Handa.jpg",
   "Great Skuas are aggressive kleptoparasites that will repeatedly strike humans who approach their nest — including low-flying aircraft."],

  ["Arctic Skua",
   "Stercorarius", "parasiticus",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Stercorarius_parasiticus_RWD1.jpg/640px-Stercorarius_parasiticus_RWD1.jpg",
   "Arctic Skuas come in pale and dark morphs; chasing Terns and forcing them to drop fish mid-air is their primary feeding strategy."],

  ["Pomarine Skua",
   "Stercorarius", "pomarinus",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Pomarine_Skua.jpg/640px-Pomarine_Skua.jpg",
   "Adult Pomarine Skuas have distinctive spoon-shaped central tail feathers — the feature gives the species its common name."],

  // ── Gulls ─────────────────────────────────────────────────────────────────
  ["Black-legged Kittiwake",
   "Rissa", "tridactyla",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Kittiwake_on_Farne_Island.jpg/640px-Kittiwake_on_Farne_Island.jpg",
   "The Kittiwake is named for its call. Unlike most gulls it is almost entirely pelagic outside the breeding season."],

  ["European Herring Gull",
   "Larus", "argentatus",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Herring_gull_arp.jpg/640px-Herring_gull_arp.jpg",
   "Herring Gull chicks instinctively peck at the red spot on the parent's bill to trigger regurgitation — a reflex proven experimentally by Tinbergen."],

  ["Great Black-backed Gull",
   "Larus", "marinus",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Larus_marinus_-_1.jpg/640px-Larus_marinus_-_1.jpg",
   "The world's largest gull. Great Black-backed Gulls regularly predate seabirds up to the size of a Puffin, swallowing them whole."],

  ["Lesser Black-backed Gull",
   "Larus", "fuscus",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Lesser_Black-backed_Gull_%28Larus_fuscus%29.jpg/640px-Lesser_Black-backed_Gull_%28Larus_fuscus%29.jpg",
   "Lesser Black-backed Gulls were once entirely migratory but British birds increasingly overwinter, a shift tracked since the 1960s."],

  ["Common Gull",
   "Larus", "canus",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Larus_canus_canus_1_Luc_Viatour.jpg/640px-Larus_canus_canus_1_Luc_Viatour.jpg",
   "Despite its name, the Common Gull is not the most abundant British gull — Herring and Black-headed Gulls both outnumber it."],

  ["Black-headed Gull",
   "Chroicocephalus", "ridibundus",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Larus_ridibundus_in_flight.jpg/640px-Larus_ridibundus_in_flight.jpg",
   "The Black-headed Gull's 'black' hood is actually dark chocolate-brown, and it is absent entirely in winter plumage."],

  ["Mediterranean Gull",
   "Ichthyaetus", "melanocephalus",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Mediterranean_Gull_Larus_melanocephalus.jpg/640px-Mediterranean_Gull_Larus_melanocephalus.jpg",
   "The Mediterranean Gull has a pure white wingtip with no black — distinguishing it from the Black-headed Gull at a glance."],

  ["Little Gull",
   "Hydrocoloeus", "minutus",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Little_Gull_%28Hydrocoloeus_minutus%29.jpg/640px-Little_Gull_%28Hydrocoloeus_minutus%29.jpg",
   "The Little Gull is the world's smallest gull. Adults have a distinctive black underwing that flashes conspicuously in flight."],

  // ── Terns ─────────────────────────────────────────────────────────────────
  ["Arctic Tern",
   "Sterna", "paradisaea",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/ArcticTern23.jpg/640px-ArcticTern23.jpg",
   "Arctic Terns migrate ~90,000 km per year pole-to-pole — over a lifetime this exceeds three trips to the Moon and back."],

  ["Common Tern",
   "Sterna", "hirundo",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/CommonTern23.jpg/640px-CommonTern23.jpg",
   "Common Terns can live over 30 years and return to the same colony annually with remarkable nest-site fidelity."],

  ["Sandwich Tern",
   "Thalasseus", "sandvicensis",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Sandwich_Tern_-_Farne_Islands.jpg/640px-Sandwich_Tern_-_Farne_Islands.jpg",
   "Sandwich Terns are named after Sandwich in Kent, where the species was first scientifically described in 1784."],

  ["Roseate Tern",
   "Sterna", "dougallii",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Roseate_Tern_-RTP.jpg/640px-Roseate_Tern_-RTP.jpg",
   "The Roseate Tern is one of Britain's rarest breeding seabirds; the UK population is largely confined to a handful of Irish Sea islands."],

  ["Little Tern",
   "Sternula", "albifrons",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Sternula_albifrons_-_Little_Tern.jpg/640px-Sternula_albifrons_-_Little_Tern.jpg",
   "Little Terns nest on open shingle beaches — one of Britain's most exposed and predator-vulnerable nesting sites."],

  // ── Divers & Grebes (coastal / offshore) ─────────────────────────────────
  ["Red-throated Diver",
   "Gavia", "stellata",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Red-throated_loon_in_nonbreeding_plumage.jpg/640px-Red-throated_loon_in_nonbreeding_plumage.jpg",
   "Red-throated Divers are the only diver able to take off from land — all other species require a long water run-up."],

  ["Great Northern Diver",
   "Gavia", "immer",
   "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Gavia_immer_-_nest.jpg/640px-Gavia_immer_-_nest.jpg",
   "The haunting wail of the Great Northern Diver is the defining sound of North American wilderness and Scottish sea lochs in winter."],
];

const ALL_NAMES = BIRDS.map(b => b[0]);
const MAX_G     = 6;
const MAX_P     = 6;
const BLUR_SEQ  = [32, 26, 19, 13, 7, 3, 0];
const XC_BASE   = "https://xeno-canto.org/api/3/recordings";