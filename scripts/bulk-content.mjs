/**
 * Stage B content: hand-written product copy (British English, rewritten
 * from Amazon's bullets, not copied) for each ASIN researched by
 * bulk-research.mjs. Consumed by bulk-build.mjs, which merges this with the
 * scraped images/variant matrix, uploads images to R2, and writes the final
 * Product records.
 *
 * Per user instruction: brand appears in `title` (H1) but never in `slug`
 * or `metaTitle`, both of which are written for SEO.
 */

const COLOUR_HEX = {
  black: "#1A1A1A",
  "black warrior": "#1A1A1A",
  grey: "#808080",
  gray: "#808080",
  "dark grey": "#4A4A4A",
  "dark gray": "#4A4A4A",
  "light grey": "#B0B0B0",
  "shadow grey": "#5C5C5C",
  "mid-hemp gray": "#8C8A72",
  brown: "#6B4423",
  beige: "#D9C7A3",
  pink: "#F4B6C2",
  "dusty pink": "#D8A7B1",
  "sage green": "#9CAF88",
  "dark green": "#2F4F2F",
  "forest green": "#228B22",
  green: "#4CAF50",
  navy: "#1B2A4A",
  purple: "#6A4C93",
  charcoal: "#36454F",
  hazel: "#8E7618",
};

export function hexForColour(name) {
  return COLOUR_HEX[name.trim().toLowerCase()] || undefined;
}

export const PRODUCTS = [
  {
    asin: "B0GZPVDTL5",
    title: "Pawinner Wheeled Cat Carrier with Locking Wheels, Airline Approved, Up to 9kg",
    slug: "wheeled-cat-carrier-with-locking-wheels-airline-approved",
    metaTitle: "Wheeled Cat Carrier - Airline Approved, Locking Wheels",
    metaDescription:
      "A 3-in-1 wheeled cat carrier with a locking pull-rod, shoulder strap and hand-carry handle. Airline approved, holds pets up to 9kg. Fast UK delivery.",
    brand: "Pawinner",
    finalPrice: 63.99,
    category_slugs: [
      "carriers/cat-carriers",
      "carriers/pet-rolling-carriers",
      "carriers/pet-airline-approved-carriers",
      "carriers/cat-carriers/airline-approved-cat-carriers",
      "carriers/pet-car-travel-carriers",
      "carriers/pet-carriers-for-vet-visits",
    ],
    features: [
      "3-in-1 carrying style: hand-carry handle, shoulder strap or wheeled pull-rod",
      "Two lockable swivel wheels so it stays put when parked",
      "600D Oxford fabric that resists water, tears and everyday scuffs",
      "Thickened, shock-absorbing base cushion to ease pressure on joints",
      "Mesh ventilation windows on multiple sides plus a roll-up top",
      "Side zip opening for feeding or reassuring your cat without a full open-up",
      "Side storage pocket, reflective safety strip and an ID card slot",
      "Sturdy PP board base with a removable, washable double-sided pad",
    ],
    specifications: {
      Dimensions: "Approximately 45 x 30 x 30cm",
      "Weight capacity": "Up to 9kg (20lbs)",
      Material: "600D Oxford fabric",
      Wheels: "2 lockable swivel wheels",
      "Carry options": "Hand-carry, shoulder strap, wheeled pull-rod",
    },
    faqs: [
      {
        question: "Is this carrier airline approved?",
        answer:
          "It's sized to meet the under-seat dimensions many airlines set for cabin pet carriers, but policies vary between airlines, so it's worth checking your airline's own pet carrier rules before you fly.",
      },
      {
        question: "Can I stop the wheels rolling when it's standing still?",
        answer: "Yes, two of the swivel wheels lock in place, which keeps the carrier from drifting when you're not moving.",
      },
      { question: "How much weight can it hold?", answer: "It's built for cats and small dogs up to approximately 9kg (20lbs)." },
      {
        question: "Is it easy to clean?",
        answer: "The double-sided base pad lifts out for washing, and the outer fabric wipes clean; check the care label before machine washing the whole carrier.",
      },
      {
        question: "Will my cat be able to see out?",
        answer: "Yes, mesh windows run along the sides plus the roll-up top, giving good airflow and a view out.",
      },
    ],
    description: `## About the Pawinner Wheeled Cat Carrier

Long airport queues and heavy shoulder straps are the main reason a lot of [cat carriers](/carriers/cat-carriers) end up gathering dust after one trip. This one is built around a locking pull-rod and two swivel wheels, so it rolls alongside you instead of pulling on your arm, then converts back to a hand-carry or shoulder-strap bag the moment you're somewhere the wheels can't go, like up a flight of stairs or through a narrow vet's waiting room.

The 600D Oxford shell is thickened for a bit of everyday knock-resistance and wipes clean rather than needing a full wash after every trip. A shock-absorbing base cushion sits under your cat, which matters more than it sounds on a long wheeled journey across uneven sciepaving or airport flooring.

## Key Features and Benefits

### Three Ways to Carry It

Hand-carry handle, adjustable shoulder strap, or the telescopic pull-rod with locking wheels: swap between them depending on the terrain, without needing a different bag for each.

### Lockable Swivel Wheels

Two of the four wheels lock in place, so the carrier doesn't creep off on its own the moment you set it down on a slope or a train platform.

### Tough, Weather-Resistant Fabric

600D Oxford fabric is tear-resistant and largely water-resistant, so a bit of drizzle on the school run or a spilled water bowl isn't a disaster.

### Ventilation Without Draughts

Mesh panels run along the sides and the top rolls up when you want extra airflow, so your cat gets a clear view out without feeling shut in.

### Feed Without a Full Opening

A side zip gives access to your cat for a treat or a reassuring stroke without unzipping the whole carrier and risking an escape mid-journey.

## Who This Carrier Is Best For

This wheeled [cat carrier](/carriers/cat-carriers) suits:

- Owners who travel by train, tram or a long airport walk and would rather roll than carry
- Cats and small dogs up to around 9kg who need a proper amount of room, not just a squeeze-in bag
- [Vet visits](/carriers/pet-carriers-for-vet-visits) where a stable, wheel-locking base makes the waiting room easier
- Anyone checking their airline's cabin carrier rules for an [airline approved](/carriers/pet-airline-approved-carriers) option
- [Car travel](/carriers/pet-car-travel-carriers) where a wipeable, washable base pad makes clean-up simple

## Care Instructions

Wipe the outer fabric down with a damp cloth after use, and lift out the double-sided base pad to wash separately when it needs a proper clean. Let both the pad and the carrier dry fully before folding away, so no damp smell builds up in storage. Check zips and wheel locks periodically to keep them running smoothly.`,
  },

  {
    asin: "B0H3KFJRRR",
    mergedAsins: ["B0H3K61294"],
    title: "GYMAX Foldable Pet Carrier with Wheels, Telescopic Handle, Black & Grey",
    slug: "foldable-pet-carrier-with-wheels-telescopic-handle",
    metaTitle: "Pet Carrier with Wheels - Foldable, Telescopic Handle",
    metaDescription:
      "A foldable rolling pet carrier with a telescopic handle, four 360-degree wheels and a washable pad. For cats and small dogs up to 15kg. Fast UK delivery.",
    brand: "GYMAX",
    finalPrice: 57.99,
    category_slugs: [
      "carriers/pet-rolling-carriers",
      "carriers/cat-carriers",
      "carriers/dog-carriers/small-dog-carriers",
      "carriers/pet-soft-sided-carriers",
      "carriers/pet-carriers-for-vet-visits",
    ],
    features: [
      "Telescopic handle adjustable across 3 lengths for different heights",
      "Four 360-degree wheels for smooth manoeuvring indoors and out",
      "High-density, tear-resistant Oxford fabric construction",
      "Breathable mesh windows for steady airflow and visibility",
      "Large zippered openings plus a side storage pocket",
      "Included safety leash clip to keep your pet secure inside",
      "Washable base pad for a clean, comfortable ride",
      "Folds flat for compact storage between trips",
    ],
    specifications: {
      Dimensions: "Approximately 43 x 33 x 32-35cm",
      "Weight capacity": "Up to 15kg",
      Material: "High-density Oxford fabric",
      Wheels: "4 x 360-degree rotating wheels",
      Handle: "Telescopic, adjustable to 3 lengths",
    },
    faqs: [
      {
        question: "What size pet is this carrier suitable for?",
        answer: "It's designed for small to medium pets up to around 15kg, which covers most cats and smaller dog breeds.",
      },
      { question: "Does it fold flat for storage?", answer: "Yes, it collapses down when not in use, so it doesn't take up permanent space in a car boot or cupboard." },
      { question: "Is the pad removable for washing?", answer: "Yes, the base pad lifts out and can be washed separately to keep the carrier fresh." },
      {
        question: "Can I use it without the wheels?",
        answer: "Yes, it also carries by the adjustable shoulder strap or hand-carry handle when wheels aren't practical, such as on stairs.",
      },
      {
        question: "Which colours are available?",
        answer: "It comes in Black and Grey, each in its own size, shown in the colour options above.",
      },
    ],
    description: `## About the GYMAX Foldable Pet Carrier with Wheels

Vet trips and travel days go more smoothly when you're not wrestling a heavy bag through a car park. This [pet carrier with wheels](/carriers/pet-rolling-carriers) uses a telescopic handle you can adjust to three lengths, paired with four 360-degree wheels, so it tracks smoothly whether you're crossing tarmac or weaving through a busy waiting room.

Underneath the wheeled frame it's still a proper [soft-sided carrier](/carriers/pet-soft-sided-carriers): high-density Oxford fabric holds its shape, mesh windows keep air moving, and a washable base pad means accidents on a long journey aren't a lasting problem. When the wheels aren't practical, such as on stairs or a crowded train, it switches to a shoulder strap or hand-carry handle instead.

## Key Features and Benefits

### Adjustable Telescopic Handle

Three handle lengths mean you're not stooping to pull the carrier along, whatever your height, and it tucks away neatly when you're carrying by hand instead.

### Four 360-Degree Wheels

Smooth-rolling wheels turn easily in any direction, which makes weaving through doorways, lifts and busy pavements far less awkward than a rigid two-wheel design.

### Durable, Breathable Build

Tear-resistant Oxford fabric keeps its shape trip after trip, while mesh panels on multiple sides give your pet a clear view out and steady airflow.

### Secure Inside, Easy to Access

A safety leash clip stops your pet bolting the moment a zip opens, while large zippered openings and a side pocket keep essentials within reach.

### Folds Flat When Not in Use

Once you're home, the frame collapses down for storage, so it doesn't sit taking up space between trips.

## Who This Carrier Is Best For

This rolling pet carrier suits:

- [Cat carriers](/carriers/cat-carriers) needs for owners who'd rather wheel than carry on longer walks to the vet or the car
- [Small dogs](/carriers/dog-carriers/small-dog-carriers) up to around 15kg who need a bit more room than a basic bag-style carrier
- [Vet visits](/carriers/pet-carriers-for-vet-visits) where a stable, wheeled base makes waiting rooms easier to manage
- Anyone who wants both a wheeled option and a shoulder-carry option in one bag

## Care Instructions

Wipe the Oxford fabric shell down with a damp cloth as needed, and remove the base pad to wash it separately when it needs a proper clean. Leave both fully dry before folding the carrier away, and check the wheels and handle joints occasionally to keep them moving freely.`,
  },

  {
    asin: "B0F9WKZFRG",
    title: "PAWZIDEA Expandable Rolling Cat Carrier with Wheels, TSA Airline Approved",
    slug: "expandable-rolling-cat-carrier-with-wheels-airline-approved",
    metaTitle: "Expandable Cat Carrier with Wheels - Airline Approved",
    metaDescription:
      "An expandable rolling cat carrier with a telescopic handle, four silent wheels and TSA airline-approved sizing. Nearly double the interior space. Fast UK delivery.",
    brand: "PAWZIDEA",
    finalPrice: 106.99,
    category_slugs: [
      "carriers/cat-carriers",
      "carriers/pet-rolling-carriers",
      "carriers/pet-airline-approved-carriers",
      "carriers/cat-carriers/airline-approved-cat-carriers",
      "carriers/pet-car-travel-carriers",
      "carriers/pet-carriers-for-vet-visits",
    ],
    features: [
      "Zip-open front expands the interior to nearly double the standard space",
      "TSA airline-approved sizing to fit under most aeroplane seats",
      "Four 360-degree removable, replaceable silent wheels",
      "Telescopic aluminium handle for effortless pushing and pulling",
      "Roll-up top load door plus dual side mesh doors for easy access",
      "Reinforced steel frame with a leak-proof PP board base",
      "Self-locking zippers that only open when lifted straight up",
      "Built-in safety leash clip and a large side storage pocket",
    ],
    specifications: {
      Dimensions: "46 x 28 x 28cm (expandable)",
      "Weight capacity": "Up to 8.1kg",
      Material: "Chew-resistant mesh with a reinforced steel frame",
      Wheels: "4 x removable, replaceable silent wheels",
      Handle: "Telescopic aluminium",
    },
    faqs: [
      { question: "How much does the expandable panel add?", answer: "The zip-open front nearly doubles the usable interior space compared with the carrier folded flat, giving your cat more room to stretch out once you've arrived." },
      { question: "Is it genuinely airline approved?", answer: "It's sized to TSA airline-approved dimensions to fit under most aeroplane seats, but we'd still recommend checking your specific airline's pet policy before booking." },
      { question: "Can the wheels be removed?", answer: "Yes, all four wheels are removable and replaceable, which is useful if you want to carry it without wheels for part of a journey." },
      { question: "What's the weight limit?", answer: "It's built for two small cats, one large cat, a small dog, a puppy, or a rabbit up to approximately 8.1kg." },
      { question: "Does the base come out for cleaning?", answer: "Yes, the leak-proof PP board base has a removable, washable double-sided pad." },
    ],
    description: `## About the PAWZIDEA Expandable Rolling Cat Carrier

Most soft-sided [cat carriers](/carriers/cat-carriers) trade space for portability, which is fine for a short trip but cramped for anything longer. This one gets around that with a zip-open front panel that nearly doubles the interior once you've arrived, so your cat can stretch out properly rather than stay curled up for the whole journey, while still folding back down to [airline approved](/carriers/pet-airline-approved-carriers) dimensions for travel.

A reinforced steel frame keeps the shape solid even with the extra panel open, and four silent, removable wheels paired with a telescopic aluminium handle mean you're pulling rather than carrying through the airport or car park. Self-locking zippers only release when lifted straight up, which is a small detail that matters a lot if you've ever had a cat work a zip open mid-journey.

## Key Features and Benefits

### Nearly Double the Interior Space

The expandable front panel opens up extra height and width once you're settled, giving cats and small dogs genuine room to move rather than just enough to sit still.

### TSA Airline-Approved Sizing

Folded flat, it's built to fit under most aeroplane seats, so it can travel with you in the cabin rather than as checked baggage (always confirm with your airline first).

### Four Silent, Removable Wheels

360-degree wheels roll smoothly and quietly, and can be taken off entirely if you'd rather carry the bag by hand or shoulder strap for part of the trip.

### Breathable From Every Angle

A roll-up top, dual side mesh doors and rear mesh panels give ventilation and visibility from nearly every side, so your cat can see you and get proper airflow.

### Built to Stay Closed

Self-locking zippers only open when pulled straight up, backed by a reinforced frame and a leak-proof base, so accidental escapes and spills are both far less likely.

## Who This Carrier Is Best For

This expandable rolling carrier suits:

- [Cat carriers](/carriers/cat-carriers) needs for two smaller cats or one larger cat who'd benefit from the extra expanded space
- Owners flying with pets who want a genuinely [airline approved](/carriers/pet-airline-approved-carriers) fit
- [Vet visits](/carriers/pet-carriers-for-vet-visits) and longer [car travel](/carriers/pet-car-travel-carriers) where extra room reduces stress on the journey
- Anyone who wants the option to remove the wheels and carry by hand or shoulder strap

## Care Instructions

Wipe the mesh and frame down with a damp cloth, and remove the double-sided pad from the base to wash separately. Let everything dry fully before folding flat, and check the zip runners and wheel fittings occasionally to keep them working smoothly.`,
  },

  {
    asin: "B0GGB737J5",
    title: "PLJVOYK Collapsible Expandable Soft-Sided Pet Carrier, TSA Airline Approved",
    slug: "collapsible-expandable-soft-sided-pet-carrier-airline-approved",
    metaTitle: "Collapsible Pet Carrier - Airline Approved, Expandable",
    metaDescription:
      "A collapsible, expandable soft-sided pet carrier with a steel-strip frame, mesh sides and a removable mat. TSA airline approved for pets up to 7kg.",
    brand: "PLJVOYK",
    finalPrice: 82.99,
    category_slugs: [
      "carriers/pet-soft-sided-carriers",
      "carriers/pet-airline-approved-carriers",
      "carriers/everyday-pet-carriers",
      "carriers/pet-carriers-for-vet-visits",
      "carriers/dog-carriers/puppy-carriers",
      "carriers/cat-carriers",
    ],
    features: [
      "Top and side panels expand for extra height and space once settled",
      "TSA airline-approved sizing to fit under most cabin seats",
      "Steel strips built into the frame to stop sagging or deforming",
      "Mesh fabric on all four sides for a clear view and steady airflow",
      "Both top and side entrances for easy, low-stress access",
      "Detachable, adjustable shoulder strap plus a comfortable top handle",
      "Removable, washable base mat for easy cleaning",
      "Folds flat for storage and can double as an indoor pet den",
    ],
    specifications: {
      Dimensions: "Approximately 44.5 x 26.5 x 26.5cm (expandable)",
      "Weight capacity": "Up to 7kg",
      Material: "Mesh fabric with a steel-strip frame",
      Access: "Top-load and side entrances",
      Carry: "Detachable adjustable shoulder strap, top handle",
    },
    faqs: [
      { question: "How much extra room does the expansion give?", answer: "The top and sides expand by several centimetres once you're settled, giving a bit more headroom and stretching space than the carrier folded flat." },
      { question: "Is it suitable for a puppy?", answer: "Yes, it works well as a puppy carrier for pets up to around 7kg, as well as small cats and rabbits of a similar size." },
      { question: "Can I attach it to a suitcase handle?", answer: "Yes, the shoulder strap slips over a telescopic suitcase handle, or it can be secured to a car seat with a seatbelt." },
      { question: "Is the base washable?", answer: "Yes, the removable mat can be taken out and washed separately from the carrier itself." },
      { question: "Can it be used indoors as a den?", answer: "Yes, once folded out it can double as a small indoor crate or a quiet space at home, not just a travel carrier." },
    ],
    description: `## About the PLJVOYK Collapsible Expandable Pet Carrier

A carrier that only fits your pet when they're sitting perfectly still isn't much fun for longer trips. This one expands on the top and sides once you're settled, giving a genuinely useful bit of extra room to stretch out, while still folding back down small and [airline approved](/carriers/pet-airline-approved-carriers) for the journey there.

Steel strips built into the frame stop the fabric sagging under weight, which is a common weak point in cheaper [soft-sided carriers](/carriers/pet-soft-sided-carriers). Mesh panels cover all four sides, so your pet gets airflow and a view out no matter which way they're facing, and both a top-load door and side entrance mean you're not fighting a single stiff zip to get them in or out.

## Key Features and Benefits

### Expands When You Need It

Unzip the top and side panels once you've arrived for extra height and width, then fold it back down to its compact travel size for the journey.

### Reinforced Steel-Strip Frame

Steel strips run through the structure to stop the carrier sagging or losing shape, so it holds together properly even with a wriggling pet inside.

### Mesh on All Four Sides

Full mesh coverage means steady airflow and a clear view out whichever direction your pet is facing, helping nervous pets settle faster.

### Two Ways In

A top-load opening and a separate side entrance mean you can choose whichever is easier in the moment, without a single door being the only way in or out.

### Carries However You Need

A detachable, adjustable shoulder strap and a padded top handle cover hands-free and hand-carry options, and it slips over a suitcase handle for airport travel too.

## Who This Carrier Is Best For

This collapsible carrier suits:

- Small cats, [puppy carriers](/carriers/dog-carriers/puppy-carriers) needs, and rabbits up to around 7kg
- Owners who want a genuinely [airline approved](/carriers/pet-airline-approved-carriers) fit that still expands once you land
- [Vet visits](/carriers/pet-carriers-for-vet-visits), camping trips and other [everyday](/carriers/everyday-pet-carriers) outings
- Anyone who'd also like the option of using it as an occasional indoor den at home

## Care Instructions

Wipe the mesh and frame down with a damp cloth, and remove the base mat to wash separately when needed. Let everything dry fully before folding away, to avoid any musty smell building up in storage.`,
  },

  {
    asin: "B0BVY2K2JV",
    title: "KSIIA Washable Calming Dog Bed, Large Crate Mattress, Dark Grey",
    slug: "washable-calming-dog-bed-crate-mattress",
    metaTitle: "Washable Dog Bed - Calming Crate Mattress",
    metaDescription:
      "A washable, calming dog crate mattress with rose velvet surface and a non-skid Oxford base. Available in several sizes and colours. Fast UK delivery.",
    brand: "KSIIA",
    finalPrice: 35.99,
    category_slugs: ["beds/dog-beds", "beds/dog-beds/large-dog-beds", "beds/travel-beds"],
    features: [
      "8cm fibre-polypropylene fill that holds its shape under weight",
      "300 GSM rose velvet surface that's soft and skin-friendly",
      "Non-skid, tear-resistant 300D Oxford base",
      "Six stitching points to keep the filling evenly distributed",
      "Fully machine washable for easy cleaning",
      "Available in six sizes to suit breeds from small to large",
    ],
    specifications: {
      Dimensions: "90 x 60 x 8cm (L size, other sizes available)",
      "Weight guide": "Up to approximately 30kg (L size)",
      Material: "Rose velvet surface, Oxford fabric base",
      Care: "Fully machine washable",
    },
    faqs: [
      { question: "Why does the bed look flat when it arrives?", answer: "It's vacuum-packed for shipping, so it looks compressed at first. Pat it out and leave it for about 24 hours and it will fluff back up to its full thickness." },
      { question: "Can I put the whole bed in the washing machine?", answer: "Yes, it's fully machine washable, which makes it easy to keep fresh between uses." },
      { question: "Will it slide around on hard floors?", answer: "The Oxford base has a non-skid finish designed to keep the bed in place when your dog steps on or off it." },
      { question: "What size dog is the Large suitable for?", answer: "The 90 x 60 x 8cm size is designed for dogs up to roughly 30kg, covering breeds from Border Collies up to Golden Retrievers, depending on build." },
      { question: "Does it help with joint pain?", answer: "The thick, supportive fill is designed to ease pressure on joints and reduce discomfort from lying on hard flooring, though it isn't a medical treatment." },
    ],
    description: `## About the KSIIA Washable Calming Dog Bed

A bed that goes flat within a few weeks stops doing its job. This crate mattress is filled 8cm deep with fibre polypropylene that's designed to hold its shape under weight, giving proper support to bones and joints rather than compressing down to nothing after a month of regular use. It suits [dog beds](/beds/dog-beds) shopping for something that fits inside a crate as easily as it sits out in a living room corner.

The surface is a 300 GSM rose velvet, chosen for being soft against the skin and reasonably resistant to shedding hair, while the underside uses a tear-resistant 300D Oxford fabric with a non-skid finish so the bed doesn't creep across hard flooring every time your dog settles in or gets up.

## Key Features and Benefits

### Supportive, Long-Lasting Fill

The 8cm fibre-polypropylene filling is designed to stay plump rather than flatten out, giving consistent support for bones and joints over months of regular use, not just the first few weeks.

### Soft Rose Velvet Surface

A 300 GSM velvet top layer is gentle against the skin and helps dogs settle and calm down faster than a rougher fabric might.

### Non-Skid Oxford Base

The tear-resistant base fabric has a non-skid finish, so the bed stays put on wooden or tiled floors instead of sliding when your dog steps on or off.

### Even Filling That Stays in Place

Six stitching points hold the fill evenly across the whole bed, so it doesn't bunch up in one corner over time.

### Fully Machine Washable

The entire bed can go in the washing machine, which makes keeping it fresh far less hassle than a bed with a fixed, non-removable cover.

## Who This Bed Is Best For

This calming crate mattress suits:

- [Large dog beds](/beds/dog-beds/large-dog-beds) needs for breeds from Corgis and Labradors up to Golden Retrievers and German Shepherds, depending on the size chosen
- Dogs who need a bit of extra joint support on hard flooring
- Crate training, where a flat mattress fits neatly inside most standard crates
- Anyone who wants a [travel bed](/beds/travel-beds) that folds down small enough to bring along on trips

## Care Instructions

Once unpacked, pat the bed out and leave it for around 24 hours to reach its full thickness. It's fully machine washable, so pop it in on a gentle cycle when it needs a refresh, and let it air dry fully before your dog uses it again.`,
  },

  {
    asin: "B0BYMN7SLY",
    title: "JOEJOY Washable Anti-Anxiety Dog Bed with Non-Slip Base, Grey",
    slug: "washable-anti-anxiety-dog-bed-non-slip-base",
    metaTitle: "Anti-Anxiety Dog Bed - Washable, Non-Slip Base",
    metaDescription:
      "A washable rectangle dog bed with soft plush lining, thick bolster sides and a non-slip bottom. Available in several sizes. Fast UK delivery.",
    brand: "JOEJOY",
    finalPrice: 38.99,
    category_slugs: ["beds/dog-beds", "beds/dog-beds/small-dog-beds", "beds/dog-beds/large-dog-beds"],
    features: [
      "Soft, plush faux fur lining with a breathable suede exterior",
      "Hypoallergenic materials suited to sensitive skin",
      "Non-slip bottom to keep the bed steady on smooth flooring",
      "Thick bolster sides for extra head and neck support",
      "Neutral colour that fits easily into most rooms",
      "Fully machine washable for easy care",
      "Available in a range of sizes from small to large",
    ],
    specifications: {
      Dimensions: "63 x 53 x 21cm (Medium size, other sizes available)",
      Material: "Faux fur lining, suede exterior",
      Base: "Non-slip bottom",
      Care: "Machine washable",
    },
    faqs: [
      { question: "Is this bed suitable for dogs with allergies?", answer: "The lining and exterior materials are chosen to be hypoallergenic, which can help dogs with sensitive skin." },
      { question: "Will it stay in place on laminate or tiled floors?", answer: "The non-slip bottom is designed to keep the bed steady, which is particularly useful for elderly dogs or those with mobility issues." },
      { question: "What are the bolster sides for?", answer: "The thick sides give dogs somewhere to rest their head, and many dogs like the extra sense of security from being able to snuggle against them." },
      { question: "Can the whole bed be washed?", answer: "Yes, it's machine washable, so keeping it fresh doesn't need much effort." },
      { question: "What sizes are available?", answer: "It comes in a range of sizes from small through to large, so you can match it to your dog's breed and size." },
    ],
    description: `## About the JOEJOY Anti-Anxiety Dog Bed

Some dogs settle fastest with something soft to lean into. This bed pairs a plush faux fur lining with thick bolster sides, giving nervous or anxious dogs somewhere to rest their head and feel a bit more enclosed, which is often what helps them properly relax rather than stay alert on a flat mat. It's built as a genuine [dog bed](/beds/dog-beds), not just a cushion, with a breathable suede exterior underneath the soft top layer.

A non-slip bottom keeps it from sliding around on laminate or tiled floors, which matters more than it sounds for older dogs or anyone with mobility issues who needs a stable surface to settle onto. The whole thing is machine washable, so regular cleaning doesn't mean setting aside a whole afternoon.

## Key Features and Benefits

### Soft, Hypoallergenic Materials

A plush faux fur lining paired with a breathable suede exterior keeps dogs comfortable in warm weather while staying gentle on sensitive skin.

### Non-Slip Bottom

The base is designed to stay put on smooth flooring, which is especially useful for older dogs or those with joint issues who need a stable base to rest on.

### Thick Bolster Sides

Raised sides give extra head and neck support, and many dogs enjoy snuggling against them for a stronger sense of security.

### Neutral, Fits Any Room

A simple colour scheme means the bed fits into most home decor without standing out, whichever room it ends up in.

### Easy to Keep Fresh

Fully machine washable, so regular cleaning is as simple as any other load of washing.

## Who This Bed Is Best For

This anti-anxiety bed suits:

- [Small dog beds](/beds/dog-beds/small-dog-beds) and [large dog beds](/beds/dog-beds/large-dog-beds) needs across the size range available
- Dogs who settle better with raised sides to lean or rest against
- Older dogs or those with mobility issues who need a bed that won't slide underfoot
- Anyone who wants an easy-care bed that goes straight in the washing machine

## Care Instructions

The whole bed is machine washable, so wash on a gentle cycle when it needs refreshing and allow it to air dry fully before your dog uses it again. Regular shaking out between washes helps keep the filling evenly distributed.`,
  },

  {
    asin: "B0CRYWDWDG",
    title: "EHEYCIGA Memory Foam Orthopaedic Dog Bed, Large, Waterproof Cover",
    slug: "memory-foam-orthopaedic-dog-bed-waterproof-cover",
    metaTitle: "Orthopaedic Dog Bed - Memory Foam, Waterproof Cover",
    metaDescription:
      "A memory foam orthopaedic dog bed with a bolster sofa design and waterproof cover. Available in multiple sizes and colours. Fast UK delivery.",
    brand: "EHEYCIGA",
    finalPrice: 48.56,
    category_slugs: ["beds/dog-beds/orthopaedic-dog-beds", "beds/dog-beds/large-dog-beds", "beds/dog-beds"],
    features: [
      "Memory foam and egg crate foam layers for even pressure relief",
      "4-sided bolster sofa design for head and neck support",
      "Waterproof film between the fleece top and base fabric",
      "Cosy fleece sleeping surface for a soft, inviting spot to rest",
      "Removable, washable cover with a zip closure",
      "Available in multiple sizes for medium, large and extra-large breeds",
    ],
    specifications: {
      Dimensions: "91 x 68 x 17cm (Large size, other sizes available)",
      Material: "Memory foam and egg crate foam, fleece cover",
      Waterproofing: "Waterproof film under the sleeping surface",
      Care: "Removable, machine washable cover; foam insert not washable",
    },
    faqs: [
      { question: "Is the whole bed waterproof?", answer: "A waterproof film sits between the fleece surface and the base fabric to protect the foam, though the faux linen sides aren't waterproof." },
      { question: "Is the foam insert washable?", answer: "No, only the removable fleece cover should be machine washed; the foam insert itself should not go in the washing machine." },
      { question: "Is this suitable for older dogs?", answer: "Yes, the memory foam and egg crate foam combination is designed to ease pressure on joints, which can be particularly helpful for elderly dogs." },
      { question: "Why does the bed feel flat when it first arrives?", answer: "It's compressed for shipping. Allow it 24 to 48 hours after unpacking to fully expand to its proper thickness." },
      { question: "How do I clean the cover?", answer: "Unzip and remove the cover, then machine wash it separately from the foam insert." },
    ],
    description: `## About the EHEYCIGA Memory Foam Orthopaedic Dog Bed

Older dogs, or any dog who spends a lot of time lying down, benefit from more than just a soft cushion. This bed combines memory foam with a firmer egg crate foam layer underneath, giving even support across the body rather than one soft spot that compresses under weight. It's built as a proper [orthopaedic dog bed](/beds/dog-beds/orthopaedic-dog-beds), aimed at genuinely easing pressure on joints rather than just looking comfortable.

Four bolster sides give the sofa-style shape its shape, offering somewhere to rest a head or neck and encouraging dogs to properly settle in rather than sprawl across a flat mat. A waterproof film sits between the fleece top layer and the base fabric, so everyday spills and accidents don't soak straight through to the foam underneath.

## Key Features and Benefits

### Memory Foam with Egg Crate Support

Two foam layers work together: memory foam for pressure relief close to the surface, and firmer egg crate foam beneath for even, lasting support.

### Sofa-Style Bolster Design

Raised sides on all four edges give head and neck support and a sense of enclosure, which many dogs find genuinely restful compared with a flat bed.

### Protected Against Spills

A waterproof film between the fleece surface and base fabric helps keep the foam dry if there's a spill or an accident.

### Soft Fleece Sleeping Surface

The top layer is a cosy fleece, giving a warm, inviting surface that suits medium, large and extra-large breeds depending on the size chosen.

### Easy to Keep Clean

The cover unzips and comes away for machine washing, separate from the foam insert, which should be spot-cleaned rather than washed.

## Who This Bed Is Best For

This orthopaedic dog bed suits:

- Older dogs or those with joint stiffness who need genuine pressure relief, not just softness
- [Large dog beds](/beds/dog-beds/large-dog-beds) needs for medium, large and extra-large breeds, depending on size chosen
- Dogs who like to rest their head against something rather than lie flat
- Anyone wanting a [dog bed](/beds/dog-beds) with a removable, washable cover for easy upkeep

## Care Instructions

Allow the bed 24 to 48 hours after unpacking to expand fully. Unzip the cover to machine wash it separately whenever it needs refreshing, but keep the foam insert itself out of the washing machine, spot cleaning it instead, and let everything dry fully before reassembling.`,
  },

  {
    asin: "B09YNBL3QR",
    title: "Jaspuriea Washable Calming Dog Crate Mattress, Grey",
    slug: "washable-calming-dog-crate-mattress",
    metaTitle: "Calming Dog Bed - Washable Crate Mattress",
    metaDescription:
      "A washable, anti-anxiety dog crate mattress with a soft plush top and a water-resistant, anti-slip base. Available in several sizes. Fast UK delivery.",
    brand: "Jaspuriea",
    finalPrice: 33.99,
    category_slugs: ["beds/dog-beds", "beds/travel-beds", "beds/dog-beds/small-dog-beds"],
    features: [
      "Ultra-soft plush filling designed to ease muscle and joint pressure",
      "600D Oxford bottom with anti-slip dots for a secure base",
      "Water-resistant fabric that helps keep everyday dirt at bay",
      "Fully machine washable, dryer-safe on a low setting",
      "Available in a range of sizes to suit most breeds",
    ],
    specifications: {
      Dimensions: "75 x 50 x 7cm (Medium size, other sizes available)",
      "Weight guide": "Up to approximately 20kg (Medium size)",
      Material: "Plush top, 600D Oxford base",
      Care: "Machine washable, tumble dry on low",
    },
    faqs: [
      { question: "Why does the mattress look flat when it arrives?", answer: "It's vacuum-packed for shipping. Pat it out and leave it for around 24 hours and it will become properly fluffy." },
      { question: "Can this go in the tumble dryer?", answer: "Yes, it can be dried on a low temperature setting after washing." },
      { question: "What size dog is the Medium suitable for?", answer: "The 75 x 50 x 7cm size is recommended for dogs up to around 20kg." },
      { question: "Will it slide around inside a crate?", answer: "The 600D Oxford bottom has anti-slip dots designed to keep it steady, whether it's inside a crate or on an open floor." },
      { question: "Is it fully washable?", answer: "Yes, the entire mattress is machine washable, making it straightforward to keep clean." },
    ],
    description: `## About the Jaspuriea Washable Calming Dog Crate Mattress

A crate only feels welcoming if what's inside it is genuinely comfortable. This mattress uses an ultra-soft plush filling designed to ease pressure on muscles and joints, giving dogs a reason to settle into their crate rather than avoid it, which makes it a natural fit for anyone working on [dog beds](/beds/dog-beds) that double as [travel beds](/beds/travel-beds) for trips away from home.

Underneath, a 600D Oxford base with anti-slip dots keeps the mattress from sliding around inside a crate or across a smooth floor, and the fabric is water-resistant enough to shrug off most everyday dirt. Being fully machine washable and dryer-safe on a low setting means it's realistic to keep clean rather than something you dread washing.

## Key Features and Benefits

### Soft, Pressure-Relieving Fill

A 7cm plush filling is designed to relieve pressure on muscles and joints, giving a genuinely comfortable surface rather than a thin layer over a hard crate floor.

### Anti-Slip Oxford Base

The 600D Oxford bottom has anti-slip dots built in, so the mattress stays where you put it rather than bunching up as your dog moves around.

### Water-Resistant Fabric

The base fabric helps keep everyday dirt and minor spills from soaking straight through, useful for muddy paws after a walk.

### Fully Machine Washable

Wash and dry on a low setting whenever it needs freshening up, without any hand-washing or spot-cleaning faff.

### Sized for Most Breeds

Available across a range of sizes, so it's straightforward to match to your dog's crate or usual sleeping spot.

## Who This Mattress Is Best For

This crate mattress suits:

- Crate training, where a flat, well-fitted mattress makes the space feel more inviting
- [Small dog beds](/beds/dog-beds/small-dog-beds) needs as well as larger sizes for bigger breeds
- Owners who want a [travel bed](/beds/travel-beds) that folds down for trips away
- Dogs who benefit from a bit of extra cushioning on joints and pressure points

## Care Instructions

When it first arrives, pat the mattress out and leave it for about 24 hours to reach full thickness after being vacuum-packed. It's fully machine washable and can be tumble dried on a low setting, so keep it fresh with a regular wash whenever it needs one.`,
  },

  {
    asin: "B08NC88YD7",
    title: "Bedsure Washable Orthopaedic Dog Bed Sofa, Large",
    slug: "washable-orthopaedic-dog-bed-sofa",
    metaTitle: "Orthopaedic Dog Bed Sofa - Washable, Large",
    metaDescription:
      "A large orthopaedic dog bed sofa with egg-crate foam support, a 4-sided bolster design and a waterproof inner liner. Fast UK delivery.",
    brand: "Bedsure",
    finalPrice: 64.99,
    category_slugs: ["beds/dog-beds/orthopaedic-dog-beds", "beds/dog-beds/large-dog-beds", "beds/dog-beds"],
    features: [
      "High-density egg-crate foam for even weight distribution",
      "4-sided bolster design for a cosy, secure sleeping position",
      "Waterproof inner liner to protect the foam from spills",
      "Removable cover, machine washable for easy cleaning",
      "Soft velvety flannel fabric on the outside",
      "Non-skid bottom to reduce slipping on hard floors",
    ],
    specifications: {
      Dimensions: "89 x 63 x 16cm",
      Material: "Egg-crate foam, flannel cover",
      Base: "Non-skid bottom",
      Care: "Unzip and machine wash cover",
    },
    faqs: [
      { question: "Is this bed genuinely orthopaedic?", answer: "Yes, it uses high-density egg-crate foam designed to distribute weight evenly and relieve pressure on joints, rather than a standard flat cushion." },
      { question: "Is the whole bed waterproof?", answer: "A waterproof inner liner surrounds the foam to protect it from spills and accidents, though the outer cover should still be cleaned promptly after any mess." },
      { question: "Can I wash the cover separately?", answer: "Yes, unzip the cover and pop it in the washing machine, keeping the foam insert itself out of the wash." },
      { question: "Will it slide on wooden or tiled floors?", answer: "The non-skid bottom is designed to reduce slipping and keep the bed in place." },
      { question: "What size dog does this suit?", answer: "At 89 x 63 x 16cm, it's suited to larger breeds who benefit from the extra space and support." },
    ],
    description: `## About the Bedsure Orthopaedic Dog Bed Sofa

A sofa-style bed only earns the name if the support underneath actually holds up. This one uses high-density egg-crate foam to distribute weight evenly and relieve pressure on joints, rather than a single flat cushion that compresses under one spot, making it a genuine option among [orthopaedic dog beds](/beds/dog-beds/orthopaedic-dog-beds) rather than just a soft-looking cushion.

Four bolster sides wrap around the base, giving your dog somewhere to rest their head and a cosy, enclosed feel that a lot of dogs find reassuring. A waterproof inner liner sits between the foam and the outer flannel cover, so spills and accidents don't soak straight through, and the whole cover unzips off for a proper wash when it needs one.

## Key Features and Benefits

### Even Support from Egg-Crate Foam

High-density foam is shaped to distribute your dog's weight evenly across the bed, giving pressure relief and joint support rather than one compressed hollow.

### Cosy 4-Sided Bolsters

Raised sides all the way around offer head and neck support and a sense of security, which many dogs settle into more readily than a flat mat.

### Protected Against Spills

A waterproof inner liner keeps the foam dry and protected, so everyday accidents don't ruin the bed's support over time.

### Soft Flannel Exterior

A velvety flannel fabric wraps the whole bed, giving a soothing surface that even anxious dogs tend to find comfortable and relaxing.

### Stays Put on Hard Floors

The non-skid bottom reduces slipping, so the bed doesn't creep across wooden or tiled flooring as your dog moves on and off it.

## Who This Bed Is Best For

This orthopaedic sofa bed suits:

- [Large dog beds](/beds/dog-beds/large-dog-beds) needs for bigger breeds who need proper support, not just a soft cushion
- Older dogs or those with joint stiffness who benefit from even weight distribution
- Dogs who like to snuggle into raised sides rather than sleep flat
- Anyone who wants a washable cover for straightforward upkeep

## Care Instructions

Unzip the cover and machine wash it separately whenever it needs cleaning, keeping the foam insert out of the washing machine. Let the cover dry fully before zipping it back over the foam, and check the non-skid base periodically to keep it gripping properly.`,
  },

  {
    asin: "B0CRYW1CDB",
    title: "EHEYCIGA Memory Foam Orthopaedic Dog Bed, Medium, Waterproof Cover",
    slug: "memory-foam-orthopaedic-dog-bed-medium-waterproof",
    metaTitle: "Orthopaedic Dog Bed Medium - Memory Foam",
    metaDescription:
      "A medium memory foam orthopaedic dog bed with a bolster sofa design and waterproof cover. Multiple sizes and colours available. Fast UK delivery.",
    brand: "EHEYCIGA",
    finalPrice: 47.99,
    category_slugs: ["beds/dog-beds/orthopaedic-dog-beds", "beds/dog-beds", "beds/dog-beds/small-dog-beds"],
    features: [
      "Memory foam and egg crate foam layers for even pressure relief",
      "4-sided bolster sofa design for head and neck support",
      "Waterproof film between the fleece top and base fabric",
      "Cosy fleece sleeping surface for a soft, inviting spot to rest",
      "Removable, washable cover with a zip closure",
      "Available in multiple sizes for small, medium and large breeds",
    ],
    specifications: {
      Dimensions: "76 x 51 x 16cm (Medium size, other sizes available)",
      Material: "Memory foam and egg crate foam, fleece cover",
      Waterproofing: "Waterproof film under the sleeping surface",
      Care: "Removable, machine washable cover; foam insert not washable",
    },
    faqs: [
      { question: "How is this different from the Large size?", answer: "It's the same memory foam and bolster construction, just in the smaller 76 x 51 x 16cm Medium size, better suited to smaller breeds or more compact spaces." },
      { question: "Is the foam insert washable?", answer: "No, only the removable fleece cover should be machine washed; the foam insert should be spot-cleaned instead." },
      { question: "Is it suitable for older dogs?", answer: "Yes, the memory foam and egg crate foam combination is designed to ease pressure on joints, which can help older or stiffer dogs." },
      { question: "Why does it feel flat when it first arrives?", answer: "It's compressed for shipping. Allow it 24 to 48 hours after unpacking to expand to its full thickness." },
      { question: "How do I clean the cover?", answer: "Unzip and remove it, then machine wash separately from the foam insert." },
    ],
    description: `## About the EHEYCIGA Memory Foam Orthopaedic Dog Bed, Medium

Smaller and medium dogs benefit from the same kind of joint support as larger breeds, just at a more suitable scale. This Medium size carries over the same construction as the rest of the EHEYCIGA range: memory foam paired with a firmer egg crate foam layer beneath it, built as a genuine [orthopaedic dog bed](/beds/dog-beds/orthopaedic-dog-beds) rather than a standard cushion, just sized down for smaller frames or more compact rooms.

Four bolster sides give the sofa-style shape, offering somewhere to rest a head and a bit of a cosier, more enclosed feel than a flat mat. A waterproof film between the fleece surface and the base fabric protects the foam from everyday spills, and the whole cover unzips off for a proper wash separate from the foam insert.

## Key Features and Benefits

### Memory Foam with Egg Crate Support

Two foam layers combine pressure relief close to the surface with firmer, more even support underneath, sized right for medium breeds.

### Sofa-Style Bolster Design

Bolster sides on all four edges give head and neck support and a sense of enclosure that many dogs settle into more easily than a flat bed.

### Protected Against Spills

A waterproof film sits between the fleece top and the base fabric, helping keep the foam dry if there's a spill or accident.

### Soft Fleece Sleeping Surface

A cosy fleece top layer gives a warm, inviting surface, well suited to small and medium breeds in this size.

### Easy to Keep Clean

The cover unzips for machine washing separate from the foam insert, which should be spot-cleaned rather than washed.

## Who This Bed Is Best For

This medium orthopaedic bed suits:

- [Small dog beds](/beds/dog-beds/small-dog-beds) needs and medium breeds who need proper joint support without a bed that's too large for the space
- Older or stiffer dogs who benefit from genuine pressure relief
- Dogs who like to rest their head against raised sides rather than lie flat
- Anyone wanting a [dog bed](/beds/dog-beds) with an easy-clean, removable cover

## Care Instructions

Allow the bed 24 to 48 hours after unpacking to expand fully. Unzip the cover to machine wash it separately whenever it needs refreshing, keep the foam insert out of the washing machine and spot clean it instead, and let everything dry fully before reassembling.`,
  },
];
