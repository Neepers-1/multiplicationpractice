// Each prompt stops at a moment its writer can slow down.
const scenarioCards = {
  Scary: [
    ["Scratching at the Window", "You were in bed one night when you heard a scratching sound outside your window. It stopped the instant you sat up. What happened next?", "What was the first thing you noticed when you leaned toward the glass?"],
    ["The Spare Shadow", "You stepped under a streetlight and counted two shadows at your feet. You waved. Only one waved back.", "Where did the second shadow point?"],
    ["One More Footstep", "You hurried down the empty school hallway. Each time you stopped, one last footstep landed behind you.", "How long did you wait before you turned around?"],
    ["Return Slot", "You slid a library book into the return slot after dark. Something inside gently pushed it back out, open to a page you had never seen.", "What did you recognize on the page?"],
    ["The Empty Swing", "You crossed the playground on a windless evening. One swing rose higher and higher while all the others hung still.", "What could you hear at the top of each swing?"],
    ["A Knock Below", "You lay on the rug doing a puzzle when three knocks came from underneath it. You lived on the ground floor.", "Which puzzle piece was still in your hand when the knocking started again?"],
    ["Last Stop", "You were the last passenger on the school bus. As you stood up to leave, a small voice from the back asked you to save its seat.", "What did you see between the rows of seats?"],
    ["The Missing Minute", "You watched the kitchen clock jump from 8:12 to 8:14. In that missing minute, someone had set an extra place at the table.", "What was different about the extra place setting?"],
    ["Footprints on the Ceiling", "You woke to a soft patter. A trail of wet footprints crossed your ceiling and stopped directly above your bed.", "What did the last footprint do while you watched?"],
    ["The Wrong Reflection", "You brushed your teeth and smiled at the mirror. Your reflection kept a straight face and raised one finger to its lips.", "Where did your reflection look after it signaled for quiet?"],
    ["Forgotten Floor", "You pressed the elevator button for the lobby. The doors opened on a moonlit garden, and a trail of muddy shoeprints led into the elevator.", "What lay in the very first shoeprint?"],
    ["Just a Hanger", "You opened your closet to put away a jacket. An empty hanger swung forward and caught the sleeve before you let go.", "Did you hold on to the jacket or loosen your grip? Describe that instant."],
    ["The Tent Zipper", "You woke in your tent to the sound of the zipper moving. Everyone in your tent was still asleep, and the zipper pull was on the inside.", "What tiny change could you see through the opening?"],
    ["Night at the Aquarium", "You stood in front of a dark aquarium tank when five lights blinked on inside it. Four drifted closer together. One followed you.", "How did you test whether it was really following you?"],
    ["The Second Voice", "You played back a recording of yourself reading. Between two sentences, another voice whispered the name of the next chapter.", "What did you hear in the silence just before the whisper?"],
    ["Wet Umbrella", "You pulled an old umbrella from the stand on a sunny morning. Rain began tapping on it from underneath.", "What happened when you tilted the umbrella?"],
    ["Under the Stage", "You reached under the stage for a lost prop. A hand in a velvet glove slid it into your palm, then waited for something in return.", "What did the waiting hand do that made you pause?"],
    ["A Light Across the Lake", "You flashed your camping lantern twice across the lake. Two flashes answered from a cabin you had watched sink underwater that afternoon.", "What signal did you try next?"],
    ["Weather Report", "You turned on a dusty radio during a storm. The announcer described the weather inside your bedroom.", "Which detail convinced you the announcer could see the room?"],
    ["Hush in the Museum", "You bent to tie your shoe in the museum. When you looked up, every painted face in the gallery was watching the same closed door.", "What changed at the door while you were looking?"],
    ["The Backward Bell", "You stayed late at school and heard the dismissal bell play backward. One by one, the classroom lights blinked on down the empty hall.", "Which light came on last, and why did that room matter to you?"],
    ["A Room in the Photograph", "You found an old photograph of your bedroom. In the picture, a narrow door stood where there had always been a blank wall.", "What did your hand find when you touched that spot on the wall?"],
    ["The Tunnel Echo", "You called your name into a stone tunnel. Your echo came back in a hurry, as if something behind it had started to run.", "What sound followed the last syllable of your name?"],
    ["The Unclaimed Suitcase", "You watched the last suitcase circle the empty baggage belt. With each lap it came back a little bigger, and the latch had begun to bend.", "What could you hear over the rumble of the belt?"],
    ["The Hall Light", "You switched off the hall light before bed. A voice halfway down the dark hall politely asked you to turn it back on.", "What made you reach for the switch or pull your hand away?"]
  ],
  Silly: [
    ["Pancake on the Run", "You were about to pour syrup on your pancake when it rolled itself up and made a break for the edge of the table.", "What did the pancake use to make its getaway?"],
    ["The Principal's Shoes", "You stood beside the principal during assembly when her shiny shoes started squeaking the school song. She looked straight at you for help.", "What happened when the song reached the high note?"],
    ["A Very Small Parade", "You lifted your pencil case and found a parade of ants underneath. The grand marshal rode a raisin and waved your missing eraser.", "What made the whole parade come to a sudden stop?"],
    ["The Sneezing Trophy", "You stepped up to collect the spelling trophy. Before you could say thank you, the trophy sneezed glitter straight into the microphone.", "How did the first person in the audience react?"],
    ["Noodle Mustache", "You slurped the last noodle in your bowl. It stuck to your upper lip and politely introduced itself as your new mustache.", "What did it ask you to do with your face?"],
    ["Ducks on Duty", "You arrived for soccer practice and found eleven ducks lined up on the field. The smallest duck blew your coach's whistle.", "How did the duck explain the first drill?"],
    ["Runaway Shopping Cart", "You let go of the shopping cart to grab some cereal. It rolled to the fruit aisle and started choosing its own groceries.", "Which item did the cart seem especially determined to have?"],
    ["The Sock Interview", "You opened your sock drawer and found two socks behind a tiny desk. They asked what made you qualified to wear them.", "What happened to your confidence when one sock began taking notes?"],
    ["The Upside-Down Photo", "You lined up for the class photo. As the photographer counted to three, everyone floated upside down except you.", "What did you see at eye level that you normally saw near the floor?"],
    ["The Loudest Whisper", "You tried to whisper a secret to your friend at lunch. It came out in the voice of a stadium announcer.", "Who turned toward you first?"],
    ["Banana Phone", "You peeled a banana and heard a ringtone. A voice on the other end asked whether the moon was ready for delivery.", "What went through your mind before you answered?"],
    ["An Honest Pencil", "You wrote that your weekend had been perfectly ordinary. Your pencil crossed out the word ordinary and tapped its eraser at you.", "Which tiny weekend disaster did the pencil want you to admit?"],
    ["Pigeon Post", "You opened your bedroom window and a pigeon delivered a bill for all the songs it had sung outside. It accepted payment in crumbs.", "Which item on the bill made you look twice?"],
    ["The Giggle Jar", "You unscrewed a jam jar labeled Giggles during silent reading. The first giggle slid under your chair and found someone wearing squeaky shoes.", "How did you try to catch a laugh without making a sound?"],
    ["Tuba Trouble", "You raised the tuba for your first solo. A perfectly round potato popped out and rolled toward the conductor.", "What did the conductor do with the baton?"],
    ["A Hat for the Wind", "You chased your cap across the playground. The wind put it on, and for the first time you could see exactly where the wind was going.", "How could you tell the wind liked your hat?"],
    ["The Cake Election", "You cut into a birthday cake and found a tiny election underway on the bottom layer. The candidates both wanted the last candle.", "What did the nearest crumb-sized voter shout up to you?"],
    ["The Wrong Applause", "You dropped a spoon in the cafeteria, and every lunch box applauded. When you picked it up, they all went quiet and waited.", "What did you try with the spoon next?"],
    ["The Substitute Wizard", "You asked the substitute teacher for a fresh sheet of paper. Your desk turned into a sheep, and the teacher checked the spelling in his notebook.", "What did your desk do before the teacher could try again?"],
    ["A Taxi for a Frog", "You hailed a tuk-tuk in the rain. A frog in a tiny necktie already sat in the back and patted the seat beside it.", "What clue told you the frog was late for something?"],
    ["Remote Control Recess", "You found a remote control under the slide. When you pressed pause, every bouncing ball froze in midair, but the children kept running.", "Which ball needed your attention first?"],
    ["Lost and Found", "You went to lost and found for your lunch bag. The person behind the desk handed you a hiccup and said someone had turned it in that morning.", "How did you carry a hiccup across the room?"],
    ["A Bat at Bat", "You got ready to swing at baseball practice. Your bat unfolded two little wings and flew to the pitcher's mound to negotiate.", "What could you tell from the pitcher's expression?"],
    ["The Left-Shoe Race", "You tied your shoes at the starting line. When the whistle blew, your left shoe sprinted away with your foot still in it.", "What did your right foot do in that first surprising second?"],
    ["The Curtain Call", "You bowed at the end of the school play. The curtain took a bow too, then stayed out front to enjoy the applause.", "How did you try to get the curtain's attention?"]
  ],
  Fantasy: [
    ["The Pocket Dragon", "You reached into your raincoat for a tissue and found a dragon curled around your last coin. It had the hiccups, and your pocket was getting warm.", "What tiny movement told you the dragon was waking up?"],
    ["The Moon Orchard", "You climbed the orchard wall at dusk. A silver moon hung from each branch, and the lowest one dropped into your hands.", "How did the weight of a moon surprise you?"],
    ["An Unfolding Map", "You unfolded an old map on your desk. A blue river rose off the paper and a tiny boat bumped against your pencil.", "Who or what sat in the boat?"],
    ["The Quiet Giant", "You found a giant kneeling behind the hill, trying to thread a needle no bigger than your finger. One great tear landed beside your shoe.", "How did you let the giant know you were there?"],
    ["The Baker of Clouds", "You stepped into a bakery just as the baker pulled a thundercloud from the oven. She handed you the tongs and hurried for a bigger tray.", "What could you hear inside the cloud?"],
    ["The Last Blue Feather", "You helped a bird gather loose feathers by the river. When you touched the blue one, the water paused halfway over the waterfall.", "What suddenly became easy to hear?"],
    ["A Key in the Sand", "You dug a moat around your sandcastle and uncovered a gold key. A tiny guard on the battlements immediately lowered the drawbridge.", "What did the guard do when your shadow fell over the gate?"],
    ["The Staircase Seed", "You planted a speckled seed in a cracked flowerpot. By breakfast a staircase had grown from it, and someone above had left muddy boots on the top step.", "What happened when you pressed your foot against the first step?"],
    ["Tailor to the Stars", "You visited a tailor who mended tears in the night sky. A new tear opened above town while you held the only spool of silver thread.", "What slipped through the tear first?"],
    ["The Borrowed Roar", "You agreed to hold a lion cub's roar while it took a nap. Then you felt a sneeze coming.", "Where in your body did you feel the roar gathering?"],
    ["A Letter from Tomorrow", "You unsealed a letter written in your own handwriting and dated tomorrow. A pressed purple flower slid out, still warm from the sun.", "What detail about the flower made you read the letter twice?"],
    ["The Glass Whale", "You paddled into a quiet cove. Beneath your canoe, a whale made of clear glass rolled onto its side, and a lantern glowed inside it.", "What moved between the lantern and the glass?"],
    ["The Door That Listened", "You reached a castle door with a brass ear where its handle should have been. It leaned closer when you began to speak.", "What words did you choose for a door that could listen?"],
    ["The Missing Color", "You mixed blue and yellow paint and got a folded green bird. All around the classroom, green things began to fade.", "Where did the bird look before it spread its wings?"],
    ["The Floating Market", "You stepped onto a market boat just as it lifted off the canal. Below you, the fruit seller held up the one basket you had forgotten.", "How did the canal change as the boat rose?"],
    ["The Rainmaker's Apprentice", "You were carrying a jar of rain across a dry field when the cork began to wiggle. Only one small patch of earth had asked for water.", "What did that patch of earth look like among the others?"],
    ["A Knight's Tiny Favor", "You found a beetle-sized knight guarding a crack in the sidewalk. She saluted you and asked for help moving a pebble that blocked the royal road.", "What did the pebble look like from the knight's height?"],
    ["The Library of Lost Sounds", "You opened a drawer in a library that collected lost sounds. A sound you had missed for years curled around your wrist.", "Where did that sound take you in your memory?"],
    ["The Wish Receipt", "You traded a marble for a wish at a night market. The receipt fluttered out of your hand and headed for the one person who ought never to read it.", "What did you spot between you and the fluttering paper?"],
    ["The Invisible Bridge", "You came to a river with no bridge. A fox walked straight across the air, leaving one glowing paw print at a time.", "What happened to the oldest paw print as you reached the bank?"],
    ["The Stone Egg", "You brought a smooth stone home from the beach. That night it cracked, and a tiny tide poured onto your bedside table.", "What washed ashore beside your lamp?"],
    ["The Firefly Lantern", "You opened a lantern to let a trapped firefly go. It returned with a hundred others and arranged them into the outline of a door.", "Which part of the glowing door did you notice first?"],
    ["A Name for the River", "You dangled your feet from the dock when the river asked if it could borrow your name for one afternoon. Its current went still while it waited.", "What did you want to know before answering?"],
    ["The Traveling Tree", "You sat down under a tree to finish your lunch. Its roots tucked themselves neatly away, and the whole tree took one careful step.", "What shifted in your lunch as the tree moved?"],
    ["A Dragon's Invitation", "You unfolded an invitation to a dragon's tea party. The painted dragon on the card lowered its head until its nose poked through the paper.", "What did you notice first about your unexpected guest?"]
  ],
  Gross: [
    ["The Swamp Sandwich", "You opened your lunch box and found a miniature swamp between the slices of bread. A bubble rose through the mustard and popped.", "What came out of the bubble?"],
    ["Slime at the Finish Line", "You reached the finish line of the snail race. The winning snail climbed onto your hand for its medal and left a ribbon of silver slime.", "What happened when you tried to pick up the tiny medal?"],
    ["The Cheese in Charge", "You lifted the lid on a forgotten piece of cheese. A tiny green flag waved from its fuzzy blue hilltop.", "How close did you get before the smell made you stop?"],
    ["Something in the Sock", "You pulled your soccer sock out of your bag. Something cold slid down inside it and settled in the toe with a wet plop.", "How did the sock move when you held it at arm's length?"],
    ["The Pudding Bubble", "You helped stir a giant bowl of chocolate pudding at the school fair. A bubble as big as your head bulged up and showed no sign of stopping.", "What happened to the pudding on your spoon?"],
    ["The Ogre's Recipe", "You agreed to judge an ogre's soup contest. The first bowl smelled like wet shoes, but the ogre watched you with such hopeful eyes.", "What did you do during the second before the spoon reached your lips?"],
    ["Jellyfish Jelly", "You spread grape jelly across your toast. It spread itself a little farther and then wrapped one wobbly purple arm around the crust.", "How did the toast feel when you tried to pick it up?"],
    ["The Compost Crown", "You tipped a bucket onto the compost heap. A crown made of melon rinds rose from the pile on top of a very startled worm.", "What did the worm do with its lopsided crown?"],
    ["Bubble Trouble", "You blew a bubble with your gum during a windy walk. It popped over your face just as the wind sent a cloud of dandelion fluff your way.", "What could you see through the gum and fluff?"],
    ["The Squelchy Trophy", "You won the mud relay and lifted the cup over your head. The person who filled it had forgotten to tell you what was inside.", "What was the first thing that landed on you?"],
    ["A Formal Invitation", "You lifted a rotten log during a nature walk. Beneath it, twenty woodlice sat at a banquet table, and one pulled out a damp little chair for you.", "What was the first course at the woodlice banquet?"],
    ["A Leaky Backpack", "You set your backpack on the floor and a trail of sticky orange goo crept out of the zipper. It went uphill.", "What did the goo seem to be looking for?"],
    ["The Shampoo Switch", "You washed the muddy dog before the pet show. With each rinse its fur grew longer and felt more and more like cold spaghetti.", "What did the dog do the moment you loosened your grip?"],
    ["Gloop on the Moon", "You stepped onto the moon in brand-new space boots. Instead of dust, your boot sank ankle-deep into something that wobbled like custard.", "What happened to the footprint when you pulled your boot free?"],
    ["The Hiccuping Fountain", "You leaned toward the drinking fountain. It hiccupped and handed you a little necklace of wet seaweed.", "What else could you hear somewhere inside the pipes?"],
    ["Pickle Perfume", "You volunteered to test your cousin's perfume invention. One puff filled the room with the smell of warm pickle juice, and the bottle began to fizz.", "How did you reach for the cap when your eyes were watering?"],
    ["The Lost Boot", "You tugged your boot out of a muddy ditch. Half a bootful of cold ooze came with it, along with a perfectly clean pink envelope.", "What did you have to touch to get the envelope out?"],
    ["The Great Egg Roll", "You carried a basket of hard-boiled eggs into the picnic. The bottom gave way, and the oldest egg rolled toward a very warm patch of pavement.", "Which clue told you that one egg was trouble?"],
    ["The Dust Bunny", "You swept under your bed and a dust bunny hopped onto the broom. It had whiskers made of hair and a nose that looked a lot like your missing raisin.", "What happened when the dust tickled your nose?"],
    ["The Drippy Umbrella", "You opened your umbrella in a sudden downpour. The drops hitting it smelled like tomato soup, and something noodle-shaped slid past your nose.", "What did the puddle at your feet look like?"],
    ["Slippery Handshake", "You met the mayor of Slug Town at the gates. She stretched out one glistening feeler and waited for a proper handshake.", "What did you feel as the tips of your fingers met the feeler?"],
    ["The Fridge Mystery", "You opened the refrigerator after a week away. Every container was neatly labeled except the one in the back, which was breathing little clouds of fog.", "What did the fog settle on first?"],
    ["The Burping Boots", "You tried on a pair of rubber boots at a yard sale. Each step made a different burp, and the left boot was starting to smell like boiled cabbage.", "What happened when you tried to tiptoe?"],
    ["A Sticky Situation", "You sat on a bench and discovered a blob of ancient chewing gum. When you stood up, the whole bench stood up with you.", "What did the bench sound like as you took your first step?"],
    ["The Frog Choir", "You raised your hand to conduct a frog choir at the pond. Twenty frogs drew breath, puffed up their throats, and sprayed pond scum onto your music.", "Which note or word was still visible under the slime?"]
  ]
};

// Rotate genres in the catalog so each new group of four offers a different mood.
export const scenes = Array.from({ length: 25 }, (_, index) =>
  Object.entries(scenarioCards).map(([genre, cards], genreIndex) => {
    const [title, prompt, hint] = cards[index];
    return { id: index * 4 + genreIndex + 1, title, genre, prompt, hint };
  })
).flat();

// Starters end where the writer takes over. Ellipses belong in the picker only.
export const lenses = [
  {
    id: "sight", label: "Sight", question: "What caught your eye?",
    tiers: [
      ["I saw", "I looked at", "I noticed", "I watched", "I spotted", "I could see", "I stared at", "I saw something move near"],
      ["I peered through", "My eyes followed", "Out of the corner of my eye, I caught", "A flash of color appeared beside", "I blinked twice at", "At first I could only make out", "Against the light, I could see", "My gaze settled on"],
      ["What I had taken for a shadow began to", "Only when I looked closer did I notice", "One small detail gave it away:", "Everything else went blurry as I watched", "Where there had been nothing a moment before, I saw", "For a heartbeat, all I could make out was", "Framed by the narrow gap was", "The longer I looked, the more it resembled"]
    ]
  },
  {
    id: "sound", label: "Sound", question: "What reached your ears?",
    tiers: [
      ["I heard", "I listened for", "It sounded like", "I heard a noise behind", "The sound came from", "I heard it again near", "I could just hear", "Something went quiet when"],
      ["I tilted my head toward", "A faint rattle came from", "Above all the other noises, I heard", "The silence broke when", "I pressed my ear against", "I recognized the sound of", "With each step, the noise grew", "From somewhere beneath me came"],
      ["At first I mistook the sound for", "When I held my breath, I could just make out", "In the pause between two noises, I heard", "The sound traveled through the floor before", "So faint I nearly missed it, the next sound came from", "What bothered me was the silence after", "A single note hung in the air until", "The noise came in bursts, as if"]
    ]
  },
  {
    id: "smell", label: "Smell", question: "What scent drifted through the scene?",
    tiers: [
      ["I smelled", "It smelled like", "I sniffed the air near", "The smell came from", "My nose picked up", "I covered my nose when", "The air smelled of", "I leaned closer and smelled"],
      ["A whiff of something sour drifted from", "The smell reminded me of", "Under the first smell, I noticed", "I followed the scent toward", "When the wind shifted, I smelled", "My nose wrinkled at the smell of", "The scent clung to", "A whiff of something familiar made me think of"],
      ["Before I could see it, the smell told me", "Each breath carried a little more of", "Beneath the sweetness was a sharp hint of", "One breath took me straight back to", "Whatever had passed this way had left a trace of", "The scent grew stronger every time", "A smell I knew but couldn't quite place drifted from", "I would have known that smell anywhere because"]
    ]
  },
  {
    id: "taste", label: "Taste", question: "What flavor lingered in your mouth?",
    tiers: [
      ["I tasted", "It tasted like", "My mouth felt", "On my tongue, I felt", "The first bite tasted", "I could still taste", "I took a sip and tasted", "My lips tasted of"],
      ["The first taste reminded me of", "A sharp tang lingered on", "I ran my tongue over my lips and tasted", "The flavor changed when", "Even after I swallowed, I could taste", "The sweetness faded into", "My mouth puckered at", "A salty taste spread across"],
      ["The flavor arrived slowly, first like", "One familiar taste brought back", "For something that smelled so sweet, it tasted surprisingly", "Only after I swallowed did I notice", "Each sip left a stronger trace of", "My tongue found a grain of", "Somewhere beneath the sourness, I recognized", "A taste I couldn't name lingered until"]
    ]
  },
  {
    id: "touch", label: "Touch", question: "What could your skin or body feel?",
    tiers: [
      ["I touched", "It felt like", "My fingers felt", "I held on to", "My feet brushed against", "I felt something cold on", "I pressed my hand against", "Something tickled my"],
      ["Under my fingertips, the surface felt", "A chill crept across", "The weight of it pulled at", "I tightened my grip on", "A rough edge scraped against", "Through the soles of my shoes, I felt", "When I let go, my palm still felt", "The air against my cheek felt"],
      ["I knew what it was by the way it", "What looked smooth turned out to feel like", "The slightest pressure was enough to make it", "Even through the cloth, I could feel", "The change was small, just a tremble beneath", "My fingers met something firmer than", "Where it had touched me, my skin still", "A shiver traveled from the tip of my finger to"]
    ]
  },
  {
    id: "thoughts", label: "Thoughts", question: "What question, memory, or idea crossed your mind?",
    tiers: [
      ["I thought about", "I wondered", "I asked myself why", "I remembered", "I thought it might be", "I tried to decide", "I hoped that", "I had an idea about"],
      ["I couldn't help wondering whether", "For a moment, I imagined", "I considered what might happen if", "Something about it reminded me of", "I told myself there had to be", "I tried to remember the last time", "It occurred to me that", "In my head, I pictured"],
      ["I had almost convinced myself that", "One question kept circling in my mind:", "A possibility I hadn't wanted to consider was", "The more I tried to explain it, the less I understood about", "A memory surfaced just as", "Part of me wanted to believe that", "I could think of only one reason why", "If my guess was right, the next thing I would see was"]
    ]
  },
  {
    id: "feelings", label: "Feelings", question: "How did the moment change the way you felt or acted?",
    tiers: [
      ["I felt", "I was afraid that", "I was excited about", "I felt proud when", "I smiled because", "I worried about", "I felt relieved when", "I grew curious about"],
      ["My stomach tightened when", "A grin spread across my face as", "My shoulders relaxed when", "I bit my lip and", "I let out the breath I'd been holding when", "I could hardly keep still as", "My cheeks grew warm when", "My hand shook as I"],
      ["I wanted to look brave, so I", "I wasn't sure whether to laugh or", "My feet stayed planted even as", "Relief came in one long breath when", "I tried to hide my excitement by", "I pressed my lips together to keep from", "The worry I'd been carrying loosened as soon as", "My fingers betrayed me by"]
    ]
  }
];
