// Demo backend — implements the exact same API surface as backends/supabase.js, but stores everything in localStorage.
// Lets every screen be exercised (and screenshot-verified) with no Supabase project. Data never leaves the browser.
import { uid, norm, todayISO, fuzzyMatch } from '../util.js';
import { compressPhoto, blobToDataUrl } from '../photo.js';

const KEY = 'aftershow-demo-db';
const SEED_VERSION = 16; // bump when the sample data changes; things you add are carried over
const delay = (ms = 60) => new Promise((r) => setTimeout(r, ms));
export const DEMO_LOGIN = { email: 'demo@aftershow.test', password: 'demo' };

/* ---------------- seed ---------------- */
const GENRES = {
  'Nine Inch Nails': ['Industrial', 'Alt Rock'], 'The Black Queen': ['Synth', 'Electronic'], Gojira: ['Progressive Metal', 'Groove Metal'],
  Tool: ['Progressive Metal', 'Alt Metal'], Deftones: ['Alt Metal', 'Shoegaze'], Paramore: ['Pop Punk', 'Alt Rock'], BTS: ['K-Pop', 'Pop'],
  Mastodon: ['Sludge Metal', 'Progressive Metal'], 'Moe Shop': ['Future Bass', 'Electronic'], 'Bruno Mars': ['Pop', 'Funk'],
  'System of a Down': ['Alt Metal', 'Hard Rock'], Scorpions: ['Hard Rock', 'Heavy Metal'], 'Death From Above 1979': ['Dance-Punk', 'Noise Rock'],
  Radiohead: ['Art Rock', 'Alt Rock'], 'Phoebe Bridgers': ['Indie Folk'], 'Turnstile': ['Hardcore', 'Punk']
};
const SETLISTS = {
  Paramore: ['Hard Times', 'Still Into You', 'Ain’t It Fun', 'Told You So', 'Misery Business', 'Decode', 'Crushcrushcrush', 'Rose-Colored Boy', 'Fake Happy', 'The Only Exception', 'This Is Why'],
  'Nine Inch Nails': ['Somewhat Damaged', 'Wish', 'Closer', 'March of the Pigs', 'Piggy', 'Gave Up', 'The Hand That Feeds', 'Head Like a Hole', 'Hurt'],
  'Bruno Mars': ['Finesse', '24K Magic', 'Treasure', 'Locked Out of Heaven', 'Uptown Funk'],
  Tool: ['Fear Inoculum', 'Forty Six & 2', 'Jambi', 'Schism', 'The Pot', 'Pneuma', 'Stinkfist', 'Vicarious'],
  Gojira: ['Born for One Thing', 'Silvera', 'Stranded', 'Amazonia', 'The Chant', 'Flying Whales', 'Backbone', 'L’Enfant Sauvage'],
  Deftones: ['My Own Summer', 'Be Quiet and Drive', 'Digital Bath', 'Change (In the House of Flies)', 'Knife Prty', 'Passenger', 'Root', 'Engine No. 9'],
  Mastodon: ['Blood and Thunder', 'Divinations', 'Oblivion', 'Crystal Skull', 'Black Tongue', 'Colony of Birchmen', 'Aunt Lisa'],
  'The Black Queen': ['Ice to Never', 'Distanced', 'Maybe We Should', 'Secret Spell', 'Fever Dreams', 'The End Where We Start'],
  'System of a Down': ['Prison Song', 'Chop Suey!', 'Aerials', 'B.Y.O.B.', 'Toxicity', 'Sugar', 'Spiders', 'Lonely Day'],
  Scorpions: ['Coming Home', 'Make It Real', 'The Zoo', 'Send Me an Angel', 'Wind of Change', 'Rock You Like a Hurricane', 'Still Loving You'],
  BTS: ['Dynamite', 'Boy With Luv', 'Fire', 'Butter', 'Spring Day', 'Idol', 'Mic Drop']
};
// Real setlists for shows that had none. The demo shows' dates and venues are illustrative, so each list comes from a
// real show on the same tour (source in the comment). Moe Shop plays DJ sets, which have no published setlists.
const REAL_SETLISTS = {
  // Nine Inch Nails, Wave Goodbye tour: 2009-09-08 Henry Fonda Theater, Los Angeles (ninlive.com)
  'Nine Inch Nails|2009-09-16': ['Head Like a Hole', 'Terrible Lie', 'Sin', 'March of the Pigs', 'Piggy', 'Echoplex', 'Reptile', 'I’m Afraid of Americans', 'Survivalism', 'Head Down', '1,000,000', 'Letting You', 'Burn', 'Gave Up', 'Eraser', 'Just Like You Imagined', 'The Becoming', 'I Do Not Want This', 'Down in the Park', 'Metal', 'Cars', 'Love Like Anthrax', 'Heresy', 'Get Down, Make Love', 'Mr. Self Destruct', 'Wish', 'The Hand That Feeds', 'Atmosphere', 'Dead Souls', 'The Day the World Went Away', 'Hurt'],
  // Tool, 2012 tour: 2012-01-20 Grand Prairie, TX (JamBase / setlist.fm)
  'Tool|2012-10-12': ['Hooker with a Penis', 'Jambi', 'Ions', 'Stinkfist', 'Sober', 'Pushit', 'Schism', 'Intension', 'Forty Six & 2', 'Lateralus', 'Parabol', 'Parabola', 'Ænema'],
  // Deftones, Koi No Yokan tour: 2013-03-09 Terminal 5, New York (JamBase / setlist.fm)
  'Deftones|2013-04-02': ['Diamond Eyes', 'Be Quiet and Drive (Far Away)', 'My Own Summer (Shove It)', 'Lhabia', 'Rosemary', 'Rocket Skates', 'You’ve Seen the Butcher', 'Sextape', 'Feiticeira', 'Digital Bath', 'Poltergeist', 'Tempest', 'Swerve City', 'Headup', 'Around the Fur', 'Rivière', 'Change (In the House of Flies)', 'Bloody Cape', 'Engine No. 9', '7 Words'],
  // Gojira, Magma tour: Showbox SoDo, Seattle, fall 2016 (Seattle Music Insider)
  'Gojira|2016-11-03': ['Only Pain', 'The Heaviest Matter of the Universe', 'Silvera', 'Stranded', 'Flying Whales', 'The Cell', 'Backbone', 'Remembrance'],
  // Mastodon with Eagles of Death Metal: 2017-05-12 Stage AE, Pittsburgh (JamBase / setlist.fm)
  'Mastodon|2017-02-25': ['Emperor of Sand', 'Sultan’s Curse', 'Divinations', 'The Wolf Is Loose', 'Crystal Skull', 'Ancient Kingdom', 'Bladecatcher', 'Black Tongue', 'Colony of Birchmen', 'Ember City', 'Megalodon', 'Andromeda', 'Oblivion', 'Show Yourself', 'Precious Stones', 'Roots Remain', 'Chimes at Midnight', 'Steambreather', 'Mother Puncher', 'Circle of Cysquatch', 'March of the Fire Ants'],
  // Death From Above 1979, Outrage! Is Now tour: 2018-11-02 Great American Music Hall, San Francisco (JamBase / setlist.fm)
  'Death From Above 1979|2018-05-11': ['Heads Up! Is Now', 'Dead Womb', 'Too Much Love', 'Do It!', 'My Love Is Shared', 'Losing Friends', 'If We Don’t Make It We’ll Fake It', 'Outrage! Is Now', 'Nomad', 'Caught Up', 'Moonlight', 'Turn It Out', 'White Is Red', 'Holy Books', 'Freeze Me', 'Going Steady', 'Trainwreck 1979', 'Romantic Rights', 'The Physical World', 'Right On, Frankenstein!', 'Pull Out'],
  // Paramore, Brand New Eyes tour: 2010-08-07 Star Pavilion, Hershey, PA (JamBase / setlist.fm)
  'Paramore|2010-08-14': ['Ignorance', 'Feeling Sorry', 'That’s What You Get', 'For a Pessimist, I’m Pretty Optimistic', 'Emergency', 'Playing God', 'Careful', 'Decode', 'You Ain’t Woman Enough (to Take My Man)', 'When It Rains', 'Where the Lines Overlap', 'Misguided Ghosts', 'Let the Flames Begin', 'Crushcrushcrush', 'Pressure', 'Looking Up', 'The Only Exception', 'Brick by Boring Brick', 'Misery Business'],
  // BTS, Love Yourself: Speak Yourself: 2019-05-12 Soldier Field, Chicago (KCrush). This is the real show.
  'BTS|2019-05-12': ['Dionysus', 'Not Today', 'Outro: Wings', 'Just Dance', 'Euphoria', 'Best of Me', 'Serendipity', 'Love', 'Boy with Luv', 'Dope', 'Baepsae', 'Fire', 'Idol', 'Singularity', 'Fake Love', 'Seesaw', 'Epiphany', 'The Truth Untold', 'Outro: Tear', 'Mic Drop', 'Anpanman', 'So What', 'Make It Right', 'Mikrokosmos'],
  // Radiohead, 2018 tour: 2018-07-10 Madison Square Garden, New York (JamBase / setlist.fm)
  'Radiohead|2018-07-23': ['I Wish I Knew How It Would Feel to Be Free', 'Daydreaming', 'Ful Stop', 'Myxomatosis', 'Morning Bell', 'Optimistic', 'Kid A', 'Decks Dark', 'Pyramid Song', 'Let Down', 'Bloom', 'The Numbers', 'How to Disappear Completely', 'Reckoner', 'Lotus Flower', 'Paranoid Android', 'Idioteque', 'Nude', 'Present Tense', 'Weird Fishes/Arpeggi', 'The Gloaming', 'Bodysnatchers', 'The Tourist', 'You and Whose Army?', 'No Surprises', 'The Bends', 'Egyptian Fantasy'],
  // Radiohead, 2017 tour: 2017-03-30 American Airlines Arena, Miami (Diffuser)
  'Radiohead|2017-07-02': ['Daydreaming', 'Desert Island Disk', 'Ful Stop', 'Airbag', 'Morning Bell', 'Climbing Up the Walls', 'All I Need', 'Videotape', 'Let Down', 'I Might Be Wrong', 'Lotus Flower', 'Identikit', 'Idioteque', 'Nude', 'Weird Fishes/Arpeggi', 'The Numbers', 'How to Disappear Completely', 'No Surprises', 'Burn the Witch', 'Reckoner', 'Fake Plastic Trees', 'The Tourist', 'You and Whose Army?', 'Bodysnatchers'],
  // System of a Down, Wake Up the Souls: highlights of the 35-song 2015-04-24 Wembley Arena show (Rock Sins review; positions of the rarities are approximate)
  'System of a Down|2015-04-22': ['Jet Pilot', 'Suite-Pee', 'Prison Song', 'Aerials', 'I-E-A-I-A-I-O', 'B.Y.O.B.', 'War?', 'Spiders', 'Chic ’N’ Stu', 'Cigaro', 'Toxicity', 'Sugar'],
  // Scorpions, Final Sting tour: 2012-08-04 Wacken Open Air (sanctaterra.de)
  'Scorpions|2012-08-10': ['Sting in the Tail', 'Make It Real', 'Is There Anybody There?', 'The Zoo', 'Coast to Coast', 'Loving You Sunday Morning', 'Rhythm of Love', 'Raised on Rock', 'Tease Me Please Me', 'Hit Between the Eyes', 'Dynamite', 'Kottak Attack', 'Blackout', 'Six String Sting', 'Big City Nights', 'Coming Home', 'Still Loving You', 'Rock You Like a Hurricane'],
  // Phoebe Bridgers, Reunion tour: 2022-06-14 Prospect Park Bandshell, Brooklyn (JamBase / setlist.fm)
  'Phoebe Bridgers|2022-06-12': ['Motion Sickness', 'DVD Menu', 'Garden Song', 'Kyoto', 'Punisher', 'Halloween', 'Smoke Signals', 'Funeral', 'Chinese Satellite', 'Moon Song', 'Scott Street', 'Savior Complex', 'ICU', 'Sidelines', 'Graceland Too', 'I Know the End', 'Georgia'],
  'Phoebe Bridgers|2022-09-28': ['Motion Sickness', 'DVD Menu', 'Garden Song', 'Kyoto', 'Punisher', 'Halloween', 'Smoke Signals', 'Funeral', 'Chinese Satellite', 'Moon Song', 'Scott Street', 'Savior Complex', 'ICU', 'Sidelines', 'Graceland Too', 'I Know the End', 'Georgia'],
  // Turnstile, Brooklyn Mirage 2022 (BrooklynVegan review; partial: only the songs the review names)
  'Turnstile|2023-11-02': ['Holiday', 'Real Thing', 'Big Smile', 'I Don’t Wanna Be Blind'],
  'Turnstile|2024-06-08': ['Holiday', 'Real Thing', 'Big Smile', 'I Don’t Wanna Be Blind']
};
const REAL_ARTIST = {}; // artist-level fallback: the first real setlist above
Object.entries(REAL_SETLISTS).forEach(([k, v]) => { const a = k.split('|')[0]; if (!REAL_ARTIST[a]) REAL_ARTIST[a] = v; });
// user, artist, venue, city, date (YYYY-MM-DD), rating, note, fromMemory
const ROWS = [
  ['me', 'Nine Inch Nails', 'Xcel Energy Center', 'St. Paul, MN', '2009-09-16', 5, 'Wave Goodbye tour. Still the loudest thing I have ever heard.', 1],
  ['me', 'Tool', 'Target Center', 'Minneapolis, MN', '2012-10-12', 5, 'Lateralus in full. Maynard in the shadows, exactly right.', 1],
  ['me', 'Deftones', 'Skyway Theatre', 'Minneapolis, MN', '2013-04-02', 4, 'Chino climbed everything.', 1],
  ['me', 'Gojira', 'First Avenue', 'Minneapolis, MN', '2016-11-03', 5, 'Pit never stopped. Lost a shoe, gained a friend.', 1],
  ['me', 'Mastodon', 'Roy Wilkins Auditorium', 'St. Paul, MN', '2017-02-25', 4, 'With Eagles of Death Metal. Bryant drove.', 1],
  ['me', 'The Black Queen', 'Turf Club', 'St. Paul, MN', '2017-09-22', 5, 'The show that started this whole app. Ice to Never live.', 0],
  ['me', 'Death From Above 1979', 'Fine Line', 'Minneapolis, MN', '2018-05-11', 4, 'Two guys, one wall of noise.', 1],
  ['me', 'Nine Inch Nails', 'Xcel Energy Center', 'St. Paul, MN', '2018-09-04', 5, 'Cold and Black and Infinite. Better the second time.', 0],
  ['me', 'Tool', 'Pinnacle Bank Arena', 'Lincoln, NE', '2019-06-14', 5, 'Fear Inoculum live was unreal.', 0],
  ['me', 'Moe Shop', 'Fine Line', 'Minneapolis, MN', '2019-10-09', 4, 'Bass drops, glow sticks, zero regrets.', 0],
  ['me', 'Deftones', 'Armory', 'Minneapolis, MN', '2021-10-21', 5, 'First show back after the world shut down. Everyone cried a little.', 0],
  ['me', 'Gojira', 'Palace Theatre', 'St. Paul, MN', '2022-07-19', 5, 'Magma songs finally loud enough.', 0],
  ['me', 'Paramore', 'Xcel Energy Center', 'St. Paul, MN', '2023-04-08', 5, 'Went for Mimsie, stayed for Hayley.', 0],
  ['me', 'Nine Inch Nails', 'Target Center', 'Minneapolis, MN', '2022-09-25', 5, 'Hurt, again. Obviously.', 0],
  ['me', 'Bruno Mars', 'Xcel Energy Center', 'St. Paul, MN', '2024-03-14', 4, 'Falsetto, funk and a full band. Perfect.', 0],
  ['me', 'The Black Queen', 'Fine Line', 'Minneapolis, MN', '2025-02-08', 5, 'Fever Dreams in the room it was meant for.', 0],
  ['me', 'Tool', 'Xcel Energy Center', 'St. Paul, MN', '2025-08-30', 5, 'Seventh time. Never gets old.', 0],
  // a big 2026 and a few busier years, so the archive looks like someone who goes to a lot of shows
  ['me', 'Phoebe Bridgers', 'Palace Theatre', 'St. Paul, MN', '2026-01-31', 5, 'I Know the End with the whole room screaming.', 0],
  ['me', 'Deftones', 'Target Center', 'Minneapolis, MN', '2026-02-20', 5, 'Digital Bath still makes the floor move.', 0],
  ['me', 'Moe Shop', 'First Avenue', 'Minneapolis, MN', '2026-03-07', 4, 'Glow sticks everywhere. Danced the whole set.', 0],
  ['me', 'Mastodon', 'Armory', 'Minneapolis, MN', '2026-03-28', 5, 'Bryant drove again. Obviously.', 0],
  ['me', 'Turnstile', 'First Avenue', 'Minneapolis, MN', '2026-04-18', 5, 'Pit etiquette on point. Left with a bruise and a grin.', 0],
  ['me', 'Nine Inch Nails', 'Xcel Energy Center', 'St. Paul, MN', '2026-05-30', 5, 'Closer in a room that size. Unreal.', 0],
  ['me', 'Radiohead', 'Target Center', 'Minneapolis, MN', '2026-06-20', 5, 'Everything in its right place. Cried at Pyramid Song.', 0],
  ['me', 'System of a Down', 'Surly Festival Field', 'Minneapolis, MN', '2026-07-18', 5, 'Chop Suey! with ten thousand people.', 0],
  ['me', 'Gojira', 'Roy Wilkins Auditorium', 'St. Paul, MN', '2026-08-09', 5, 'Flying Whales. Floor shook.', 0],
  ['me', 'The Black Queen', 'Fine Line', 'Minneapolis, MN', '2026-09-12', 5, 'Third time. Still the best room for it.', 0],
  ['me', 'Scorpions', 'Xcel Energy Center', 'St. Paul, MN', '2026-10-03', 4, 'Wind of Change whistle, 18,000 people.', 0],
  ['me', 'Bruno Mars', 'U.S. Bank Stadium', 'Minneapolis, MN', '2026-10-24', 5, 'Uptown Funk to close. No notes.', 0],
  ['me', 'Gojira', 'Armory', 'Minneapolis, MN', '2024-02-10', 5, 'Pit never stopped.', 0],
  ['me', 'Turnstile', 'First Avenue', 'Minneapolis, MN', '2024-05-17', 5, 'Holiday. That is the whole review.', 0],
  ['me', 'Deftones', 'Surly Festival Field', 'Minneapolis, MN', '2024-08-16', 4, 'Chino in the golden hour.', 0],
  ['me', 'Moe Shop', 'Fine Line', 'Minneapolis, MN', '2024-11-22', 4, 'Back for more bass drops.', 0],
  ['me', 'Tool', 'Target Center', 'Minneapolis, MN', '2023-03-09', 5, 'Fear Inoculum run. Maynard in the shadows.', 0],
  ['me', 'The Black Queen', 'Turf Club', 'St. Paul, MN', '2023-10-14', 5, 'Back where it started.', 0],
  ['me', 'Death From Above 1979', 'Palace Theatre', 'St. Paul, MN', '2023-07-08', 4, 'Two guys, one wall of noise. Again.', 0],
  ['me', 'System of a Down', 'Xcel Energy Center', 'St. Paul, MN', '2022-08-20', 5, 'Prison Song, then chaos.', 0],
  ['me', 'Scorpions', 'Target Center', 'Minneapolis, MN', '2022-10-30', 4, 'Still Loving You.', 0],
  ['me', 'Gojira', 'First Avenue', 'Minneapolis, MN', '2019-03-03', 5, 'Fresh off Magma and heavier than ever.', 0],
  ['me', 'Mastodon', 'Palace Theatre', 'St. Paul, MN', '2019-05-24', 4, 'Emperor of Sand run.', 0],
  ['me', 'Deftones', 'Armory', 'Minneapolis, MN', '2019-11-15', 5, 'Digital Bath, front rail.', 0],
  ['mimsie', 'Paramore', 'United Center', 'Chicago, IL', '2010-08-14', 5, 'First concert ever. Cried during Misery Business.', 1],
  ['mimsie', 'Paramore', 'Xcel Energy Center', 'St. Paul, MN', '2023-04-08', 5, 'Hayley crying during The Only Exception. Everyone crying.', 0],
  ['mimsie', 'BTS', 'Soldier Field', 'Chicago, IL', '2019-05-12', 5, 'Army bomb sea. Unreal.', 1],
  ['mimsie', 'BTS', 'Allegiant Stadium', 'Las Vegas, NV', '2022-04-15', 5, 'Permission to Dance. A dream.', 0],
  ['mimsie', 'Phoebe Bridgers', 'Armory', 'Minneapolis, MN', '2022-06-12', 4, 'Scream into the void together.', 0],
  ['mimsie', 'Radiohead', 'Xcel Energy Center', 'St. Paul, MN', '2018-07-23', 5, 'Everything in its right place.', 1],
  ['mimsie', 'Turnstile', 'First Avenue', 'Minneapolis, MN', '2023-11-02', 4, 'Pit etiquette on point.', 0],
  ['bryant', 'Mastodon', 'Roy Wilkins Auditorium', 'St. Paul, MN', '2017-02-25', 5, 'Crack the Skye in full. Bucket list.', 1],
  ['bryant', 'Gojira', 'First Avenue', 'Minneapolis, MN', '2016-11-03', 5, 'Heaviest show of my life.', 1],
  ['bryant', 'Moe Shop', 'Fine Line', 'Minneapolis, MN', '2019-10-09', 4, 'Tight set, loud mix.', 1],
  ['bryant', 'Death From Above 1979', 'Fine Line', 'Minneapolis, MN', '2018-05-11', 4, 'Sweat.', 0],
  ['bryant', 'Mastodon', 'Palace Theatre', 'St. Paul, MN', '2024-09-20', 5, 'Hushed Hunter set list. Obscene.', 0],
  ['sako', 'System of a Down', 'Wells Fargo Center', 'Philadelphia, PA', '2015-04-22', 5, 'Serj in a trench coat. Chop Suey!', 1],
  ['sako', 'Scorpions', 'Madison Square Garden', 'New York, NY', '2012-08-10', 4, 'Wind of Change whistle, everyone whistling.', 1],
  ['sako', 'System of a Down', 'SoFi Stadium', 'Inglewood, CA', '2022-05-07', 5, 'Stand for Ukraine, tour of a lifetime.', 0],
  ['hazel', 'Paramore', 'The O2 Arena', 'London, UK', '2023-06-30', 5, 'O2 Arena, life-changing.', 0],
  ['hazel', 'Radiohead', 'Victoria Park', 'London, UK', '2017-07-02', 5, 'Reckoner under open sky.', 0],
  ['hazel', 'Phoebe Bridgers', 'Alexandra Palace', 'London, UK', '2022-09-28', 4, 'Kyoto live. Heartbreak.', 0],
  ['dan', 'Turnstile', 'Brooklyn Mirage', 'Brooklyn, NY', '2024-06-08', 5, 'Heaviest dance floor of my life.', 0],
  ['dan', 'Nine Inch Nails', 'Madison Square Garden', 'New York, NY', '2025-04-02', 5, 'Production was on another level.', 0],
  ['dan', 'Gojira', 'Terminal 5', 'New York, NY', '2023-03-14', 5, 'Heaviest. Cleanest sound I have heard.', 0]
];
const TONIGHT = [ // live-logged entries, re-dated to today on every boot so Tonight is never empty
  ['mimsie', 'Phoebe Bridgers', 'Armory', 'Minneapolis, MN', 5, 'Doors just opened, crowd is already singing along.'],
  ['bryant', 'Moe Shop', 'Fine Line', 'Minneapolis, MN', 4, 'Soundcheck was already a rave.'],
  ['hazel', 'Radiohead', 'The O2 Arena', 'London, UK', 5, 'Opening with Daydreaming.']
];
const USERS = [
  { key: 'me', username: 'Grayson039', displayName: 'Will', bio: 'Archive-first. 100+ shows and counting. Conceived Aftershow at a Black Queen show.', avatarUrl: 'creepychu.gif' },
  { key: 'mimsie', username: 'Mimsie', displayName: 'Michelle', bio: 'Paramore, BTS, and anything with a good bridge.', avatarUrl: 'surprised-pikachu.gif' },
  { key: 'bryant', username: 'xSasquatchx', displayName: 'Bryant', bio: 'Mastodon, Gojira, Moe Shop, DEP.', avatarUrl: 'foxhound.jpg' },
  { key: 'sako', username: 'SakoH', displayName: 'Sako H.', bio: 'iOS dev by day. SOAD and Scorpions.', avatarUrl: 'sako.jpg' },
  { key: 'hazel', username: 'hazel_ldn', displayName: 'Hazel', bio: 'London gig-goer.', avatarUrl: '' },
  { key: 'dan', username: 'pitrat_dan', displayName: 'Dan', bio: 'NYC. If it’s loud I’m there.', avatarUrl: '' }
];
const PHOTO_SEED = [ // [user, artist, file]
  ['mimsie', 'Paramore', 'Paramore.jpg'], ['bryant', 'Mastodon', 'Mastodon.jpg'], ['sako', 'Scorpions', 'scorpions.jpg'], ['sako', 'System of a Down', 'system.JPG'],
  ['me', 'Tool', 'Tool.jpg', '2025-08-30'], ['me', 'The Black Queen', 'BlackQueen.jpg', '2017-09-22'], ['me', 'Bruno Mars', 'BrunoMars.jpg'],
  ['dan', 'Nine Inch Nails', 'NineInchNails.jpg', '2025-04-02'], ['me', 'Deftones', 'Deftones.jpg', '2021-10-21'], ['me', 'Moe Shop', 'MoeShop.jpg'], ['mimsie', 'Phoebe Bridgers', 'PhoebeBridgers.jpg', '2022-06-12']
];

function seed() {
  const db = { users: [], artists: [], venues: [], shows: [], entries: [], follows: [], likes: [], artistFollows: [], photos: [], session: null, seedVersion: SEED_VERSION };
  const idOf = {};
  USERS.forEach((u) => {
    const id = 'u_' + u.key; idOf[u.key] = id;
    db.users.push({ id, email: u.key === 'me' ? DEMO_LOGIN.email : `${u.key}@aftershow.test`, password: DEMO_LOGIN.password, username: u.username, displayName: u.displayName, bio: u.bio, avatarUrl: u.avatarUrl, theme: 'dark', settings: {}, onboarded: true, agreedToUgc: false, createdAt: new Date(Date.now() - 86400000 * 400).toISOString() });
  });
  const follow = (a, b) => db.follows.push([idOf[a], idOf[b]]);
  [['me', 'mimsie'], ['me', 'bryant'], ['me', 'sako'], ['mimsie', 'me'], ['bryant', 'me'], ['hazel', 'me'], ['dan', 'me'], ['mimsie', 'hazel'], ['sako', 'bryant']].forEach(([a, b]) => follow(a, b));
  const art = (name) => { let a = db.artists.find((x) => norm(x.name) === norm(name)); if (!a) { a = { id: 'a_' + uid().slice(0, 8), name, genres: GENRES[name] || [] }; db.artists.push(a); } return a; };
  const ven = (name, city) => { let v = db.venues.find((x) => norm(x.name) === norm(name) && norm(x.city) === norm(city)); if (!v) { v = { id: 'v_' + uid().slice(0, 8), name, city }; db.venues.push(v); } return v; };
  const show = (a, v, date) => { let s = db.shows.find((x) => x.artistId === a.id && x.venueId === v.id && x.date === date); if (!s) { s = { id: 's_' + uid().slice(0, 8), artistId: a.id, venueId: v.id, date }; db.shows.push(s); } return s; };
  let t = Date.now() - 86400000 * 30;
  ROWS.forEach(([u, an, vn, city, date, rating, note, mem]) => {
    const a = art(an), v = ven(vn, city), s = show(a, v, date);
    const sl = SETLISTS[an];
    db.entries.push({ id: 'e_' + uid().slice(0, 8), userId: idOf[u], showId: s.id, rating: rating && rating * 2, note, setlist: REAL_SETLISTS[an + '|' + date] || (!mem && sl ? sl.slice(0, 7 + (note.length % 4)) : REAL_ARTIST[an] || []), fromMemory: !!mem, isLive: false, createdAt: new Date((t += 3600000 * 5)).toISOString() });
  });
  const PHOTO_VOTES = { 'Tool.jpg': 212, 'Paramore.jpg': 128, 'Mastodon.jpg': 64, 'BlackQueen.jpg': 41, 'BrunoMars.jpg': 17, 'NineInchNails.jpg': 96, 'Deftones.jpg': 58, 'MoeShop.jpg': 33, 'PhoebeBridgers.jpg': 84 };
  PHOTO_SEED.forEach(([u, an, file, date]) => {
    const e = db.entries.find((x) => { const sh = db.shows.find((s) => s.id === x.showId); return x.userId === idOf[u] && sh.artistId === art(an).id && (!date || sh.date === date); });
    if (e) db.photos.push({ id: 'p_' + uid().slice(0, 8), showId: e.showId, uploaderId: idOf[u], url: file, votes: PHOTO_VOTES[file] ?? 3, createdAt: e.createdAt });
  });
  // Extra contenders so a few shows are real contests: [uploader, artist, show date, file, votes]
  [['hazel', 'Tool', '2025-08-30', 'ToolStage.jpg', 140], ['mimsie', 'Tool', '2025-08-30', 'ToolArms.jpg', 96], ['sako', 'Tool', '2025-08-30', 'ToolBass.jpg', 77],
   ['sako', 'Nine Inch Nails', '2025-04-02', 'NineInchNailsArms.jpg', 118], ['hazel', 'Nine Inch Nails', '2025-04-02', 'NineInchNailsGuitar.jpg', 74], ['hazel', 'Deftones', '2021-10-21', 'DeftonesStage.jpg', 71],
   ['mimsie', 'Bruno Mars', '2024-03-14', 'BrunoMarsSuit.jpg', 164], ['sako', 'Bruno Mars', '2024-03-14', 'BrunoMarsCongas.jpg', 88], ['hazel', 'Bruno Mars', '2024-03-14', 'BrunoMarsGuitar.jpg', 52],
   ['hazel', 'The Black Queen', '2017-09-22', 'BlackQueenDuo.jpg', 97], ['mimsie', 'The Black Queen', '2017-09-22', 'BlackQueenSing.jpg', 82], ['sako', 'The Black Queen', '2017-09-22', 'BlackQueenRed.jpg', 63]].forEach(([u, an, date, file, votes]) => {
    const sh = db.shows.find((x) => x.artistId === art(an).id && x.date === date);
    if (sh) db.photos.push({ id: 'p_' + uid().slice(0, 8), showId: sh.id, uploaderId: idOf[u], url: file, votes, createdAt: new Date().toISOString() });
  });
  // a couple of likes
  db.entries.slice(0, 40).forEach((e, i) => { if (i % 3 === 0) db.likes.push([idOf.mimsie, e.id]); if (i % 4 === 0) db.likes.push([idOf.bryant, e.id]); if (i % 7 === 0) db.likes.push([idOf.me, e.id]); });
  db.artistFollows.push([idOf.me, art('Gojira').id], [idOf.me, art('Tool').id]);
  const COMMENTS = [['mimsie', 'Tool', 'me', 'Still jealous. Fear Inoculum live is on my list.'], ['bryant', 'Gojira', 'me', 'Heaviest show of the decade. Still hear it.'], ['sako', 'Deftones', 'me', 'Chino climbing the speaker stack, every time.'], ['me', 'Paramore', 'mimsie', 'Best night. You cried at The Only Exception.'], ['hazel', 'Paramore', 'mimsie', 'Same tour, different city, same tears.'], ['dan', 'Nine Inch Nails', 'me', 'Hurt live still gets me.']];
  db.photoVotes = [];
  db.comments = [];
  COMMENTS.forEach(([who, an, owner, body], i) => {
    const e = db.entries.find((x) => x.userId === idOf[owner] && db.shows.find((s) => s.id === x.showId).artistId === art(an).id);
    if (e) db.comments.push({ id: 'c_' + i, entryId: e.id, userId: idOf[who], body, createdAt: new Date(Date.now() - (i + 2) * 3600000 * 5).toISOString() });
  });
  const myEntry = (an) => db.entries.find((x) => x.userId === idOf.me && db.shows.find((s) => s.id === x.showId).artistId === art(an).id);
  const ACT = [['mimsie', 'like', 'Tool'], ['bryant', 'comment', 'Gojira', 'Heaviest show of the decade. Still hear it.'], ['sako', 'like', 'Deftones'], ['hazel', 'follow'], ['dan', 'like', 'Nine Inch Nails'], ['mimsie', 'comment', 'Tool', 'Still jealous. Fear Inoculum live is on my list.'], ['dan', 'follow']];
  db.activity = ACT.map(([who, type, an, body], i) => ({ id: 'act_' + i, type, actorId: idOf[who], targetId: idOf.me, entryId: an ? myEntry(an)?.id : null, body: body || '', at: new Date(Date.now() - (i + 1) * 3600000 * 6).toISOString() }));
  return db;
}

/* ---------------- store ---------------- */
let db = null;
const listeners = new Set();
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) { db = JSON.parse(raw); } } catch { db = null; /* corrupt → reseed */ }
  const ok = db && ['users', 'artists', 'venues', 'shows', 'entries', 'follows', 'likes', 'artistFollows', 'photos'].every((k) => Array.isArray(db[k]));
  if (!ok) db = seed();
  else if (db.seedVersion !== SEED_VERSION) { const old = db; db = seed(); carryOver(old); } // new sample data, but keep what the user added
  if (!db.comments) db.comments = [];
  if (!db.activity) db.activity = [];
  if (!db.photoVotes) db.photoVotes = [];
  refreshTonight();
  save();
}
// Re-create the user's own shows, photos and profile choices inside freshly seeded data.
function carryOver(old) {
  try {
    const showOf = (id) => { const s = old.shows.find((x) => x.id === id); return s && { s, a: old.artists.find((x) => x.id === s.artistId), v: old.venues.find((x) => x.id === s.venueId) }; };
    const recreate = (showId) => { const o = showOf(showId); if (!o?.a || !o?.v) return null; return findOrCreate({ artistName: o.a.name, venueName: o.v.name, city: o.v.city || '', date: o.s.date }); };
    (old.entries || []).filter((e) => e.userMade).forEach((e) => { const f = recreate(e.showId); if (f && !db.entries.some((x) => x.userId === e.userId && x.showId === f.showId)) db.entries.push({ ...e, showId: f.showId }); });
    (old.photos || []).filter((p) => p.userMade).forEach((p) => { const f = recreate(p.showId); if (f) db.photos.push({ ...p, showId: f.showId }); });
    const om = (old.users || []).find((u) => u.id === 'u_me'), nm = db.users.find((u) => u.id === 'u_me');
    if (om && nm) Object.assign(nm, { settings: om.settings, onboarded: om.onboarded, theme: om.theme, agreedToUgc: om.agreedToUgc, bio: om.bio, displayName: om.displayName, avatarUrl: om.avatarUrl || nm.avatarUrl });
    db.session = old.session && db.users.some((u) => u.id === old.session) ? old.session : null;
  } catch { /* carry what we can */ }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch (e) { throw new Error('Browser storage is full — remove some photos or reset demo data in Settings.'); }
}
function refreshTonight() {
  const ids = new Set(db.entries.filter((e) => e.seedTonight).map((e) => e.id));
  db.entries = db.entries.filter((e) => !ids.has(e.id));
  const today = todayISO();
  TONIGHT.forEach(([u, an, vn, city, rating, note], i) => {
    const user = db.users.find((x) => x.id === 'u_' + u); if (!user) return;
    const a = db.artists.find((x) => norm(x.name) === norm(an)) || (db.artists.push({ id: 'a_' + uid().slice(0, 8), name: an, genres: GENRES[an] || [] }), db.artists[db.artists.length - 1]);
    let v = db.venues.find((x) => norm(x.name) === norm(vn)); if (!v) { v = { id: 'v_' + uid().slice(0, 8), name: vn, city }; db.venues.push(v); }
    let s = db.shows.find((x) => x.artistId === a.id && x.venueId === v.id && x.date === today); if (!s) { s = { id: 's_' + uid().slice(0, 8), artistId: a.id, venueId: v.id, date: today }; db.shows.push(s); }
    db.entries.push({ id: 'e_t' + i, userId: user.id, showId: s.id, rating: rating && rating * 2, note, setlist: [], fromMemory: false, isLive: true, seedTonight: true, createdAt: new Date(Date.now() - (i + 1) * 17 * 60000).toISOString() });
  });
}
const me = () => db.users.find((u) => u.id === db.session) || null;
const needMe = () => { const u = me(); if (!u) throw new Error('Not signed in.'); return u; };
const publicProfile = (u) => u && ({ id: u.id, username: u.username, displayName: u.displayName, bio: u.bio, avatarUrl: u.avatarUrl, theme: u.theme, settings: u.settings || {}, onboarded: u.onboarded, agreedToUgc: u.agreedToUgc, createdAt: u.createdAt });
const isPrivate = (uid_) => !!db.users.find((u) => u.id === uid_)?.settings?.private;
const iFollow = (uid_) => !!me() && db.follows.some(([a, b]) => a === me().id && b === uid_);
const canSee = (uid_) => !isPrivate(uid_) || (me() && (me().id === uid_ || iFollow(uid_)));

function hydrate(e) {
  const s = db.shows.find((x) => x.id === e.showId) || {};
  const a = db.artists.find((x) => x.id === s.artistId) || {};
  const v = db.venues.find((x) => x.id === s.venueId) || {};
  const u = db.users.find((x) => x.id === e.userId) || {};
  const m = me();
  return {
    id: e.id, userId: e.userId, username: u.username || 'unknown', avatarUrl: u.avatarUrl || '',
    showId: s.id, artistId: a.id, artistName: a.name || 'Unknown artist', genres: a.genres || [],
    venueId: v.id, venueName: v.name || 'Unknown venue', city: v.city || '', date: s.date || '',
    rating: e.rating, note: e.note || '', setlist: e.setlist || [], fromMemory: !!e.fromMemory, isLive: !!e.isLive, createdAt: e.createdAt,
    commentCount: (db.comments || []).filter((c) => c.entryId === e.id).length,
    likeCount: db.likes.filter(([, id]) => id === e.id).length, likedByMe: !!m && db.likes.some(([uu, id]) => uu === m.id && id === e.id),
    photos: db.photos.filter((p) => p.showId === e.showId && p.uploaderId === e.userId).map(hydratePhoto)
  };
}
function hydratePhoto(p) {
  const m = me(); const votes = (p.votes || 0) + (db.photoVotes || []).filter(([, pid]) => pid === p.id).length;
  return { id: p.id, url: p.url, showId: p.showId, artistId: db.shows.find((s) => s.id === p.showId)?.artistId, uploaderId: p.uploaderId, uploaderName: db.users.find((u) => u.id === p.uploaderId)?.username || '', votes, votedByMe: !!m && (db.photoVotes || []).some(([u, pid]) => u === m.id && pid === p.id), canVote: !!m && p.uploaderId !== m.id };
}
const sortNewest = (a, b) => (b.date || '').localeCompare(a.date || '') || String(b.createdAt).localeCompare(String(a.createdAt));

function findOrCreate(input) {
  const artistName = input.artistName.trim(), venueName = (input.venueName || 'Unknown venue').trim(), city = (input.city || '').trim();
  let a = db.artists.find((x) => norm(x.name) === norm(artistName)); if (!a) { a = { id: 'a_' + uid().slice(0, 8), name: artistName, genres: [] }; db.artists.push(a); }
  let v = db.venues.find((x) => norm(x.name) === norm(venueName) && (!city || !x.city || norm(x.city) === norm(city)));
  if (!v) { v = { id: 'v_' + uid().slice(0, 8), name: venueName, city }; db.venues.push(v); } else if (city && !v.city) v.city = city;
  let s = db.shows.find((x) => x.artistId === a.id && x.venueId === v.id && x.date === input.date); if (!s) { s = { id: 's_' + uid().slice(0, 8), artistId: a.id, venueId: v.id, date: input.date }; db.shows.push(s); }
  return s;
}

/* ---------------- API ---------------- */
export const api = {
  mode: 'demo',
  async init() { load(); return me() ? { id: me().id, email: me().email } : null; },
  onAuth(cb) { listeners.add(cb); return () => listeners.delete(cb); },
  _emit() { const m = me(); listeners.forEach((cb) => cb(m ? { id: m.id, email: m.email } : null)); },
  async signUp(email, password, username) {
    await delay();
    if (db.users.some((u) => norm(u.email) === norm(email))) throw new Error('That email is already registered — try signing in.');
    if (db.users.some((u) => norm(u.username) === norm(username))) throw new Error('That username is taken.');
    const u = { id: 'u_' + uid().slice(0, 8), email, password, username, displayName: '', bio: '', avatarUrl: '', theme: 'dark', settings: {}, onboarded: false, agreedToUgc: false, createdAt: new Date().toISOString() };
    db.users.push(u); db.session = u.id; save(); this._emit();
    return { needsConfirm: false };
  },
  async signIn(email, password) {
    await delay();
    const u = db.users.find((x) => norm(x.email) === norm(email) && x.password === password);
    if (!u) throw new Error('Invalid login credentials');
    db.session = u.id; save(); this._emit();
  },
  async signOut() { db.session = null; save(); this._emit(); },
  async deleteAccount() { await this.resetDemo(); await this.signOut(); }, // in demo mode "delete" restores the sample data
  async report(type, id, reason = '') { const m = needMe(); (db.reports ||= []).push({ id: uid(), reporterId: m.id, type, targetId: id, reason, at: new Date().toISOString() }); save(); },
  async resetPassword() { throw new Error('Password reset needs a live account. Demo mode has no passwords to reset.'); },
  async signInWithLink() { throw new Error('Sign-in links need a live account.'); },
  async updatePassword() { throw new Error('Passwords are not used in demo mode.'); },
  async resetDemo() { localStorage.removeItem(KEY); db = null; load(); this._emit(); },

  async getMyProfile() { await delay(20); return publicProfile(needMe()); },
  async getProfile(username) {
    await delay();
    const u = db.users.find((x) => norm(x.username) === norm(username));
    if (!u) return null;
    return { ...publicProfile(u), isMe: me()?.id === u.id, isFollowing: iFollow(u.id), followers: db.follows.filter(([, b]) => b === u.id).length, following: db.follows.filter(([a]) => a === u.id).length, locked: !canSee(u.id) };
  },
  async updateMyProfile(patch) {
    await delay(30);
    const u = needMe();
    if (patch.username && norm(patch.username) !== norm(u.username) && db.users.some((x) => norm(x.username) === norm(patch.username))) throw new Error('That username is taken.');
    Object.assign(u, patch, { settings: { ...(u.settings || {}), ...(patch.settings || {}) } });
    save(); return publicProfile(u);
  },

  async listEntries({ userId, showId, artistId, venueId, scope, limit = 500 } = {}) {
    await delay();
    const m = me(); const today = todayISO();
    let list = db.entries.filter((e) => {
      const s = db.shows.find((x) => x.id === e.showId); if (!s) return false;
      if (userId && e.userId !== userId) return false;
      if (showId && e.showId !== showId) return false;
      if (artistId && s.artistId !== artistId) return false;
      if (venueId && s.venueId !== venueId) return false;
      if (scope && e.imported) return false; // bulk imports never flood feeds
      if (scope === 'friends') { if (!m || !iFollow(e.userId)) return false; }
      if (scope === 'tonight' && s.date !== today) return false;
      if (scope === 'global' || scope === 'tonight') { if (!canSee(e.userId)) return false; }
      else if (!canSee(e.userId)) return false;
      return true;
    }).map(hydrate);
    list.sort(scope ? (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) : sortNewest);
    return list.slice(0, limit);
  },
  async getEntry(id) { await delay(); const e = db.entries.find((x) => x.id === id); return e && canSee(e.userId) ? hydrate(e) : null; },
  async createEntry(input) {
    await delay();
    const u = needMe(); const s = findOrCreate(input);
    if (db.entries.some((e) => e.userId === u.id && e.showId === s.id)) throw new Error('You already logged this show.');
    const e = { userMade: true, id: 'e_' + uid().slice(0, 8), userId: u.id, showId: s.id, rating: input.rating || null, note: input.note || '', setlist: input.setlist || [], fromMemory: !!input.fromMemory, isLive: !!input.isLive, createdAt: new Date().toISOString() };
    db.entries.push(e); save(); return hydrate(e);
  },
  async createMany(inputs, onProgress) {
    const u = needMe(); let added = 0, dupes = 0;
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]; const s = findOrCreate(input);
      if (db.entries.some((e) => e.userId === u.id && e.showId === s.id)) dupes++;
      else { db.entries.push({ userMade: true, id: 'e_' + uid().slice(0, 8), userId: u.id, showId: s.id, rating: input.rating || null, note: input.note || '', setlist: input.setlist || [], fromMemory: true, isLive: false, createdAt: new Date().toISOString(), imported: true }); added++; }
      if (i % 10 === 0) { onProgress?.(i + 1, inputs.length); await delay(0); }
    }
    save(); onProgress?.(inputs.length, inputs.length);
    return { added, dupes };
  },
  async updateEntry(id, input) {
    await delay();
    const u = needMe(); const e = db.entries.find((x) => x.id === id);
    if (!e || e.userId !== u.id) throw new Error('You can only edit your own shows.');
    const s = findOrCreate(input);
    if (db.entries.some((x) => x.id !== id && x.userId === u.id && x.showId === s.id)) throw new Error('You already logged that show.');
    Object.assign(e, { showId: s.id, rating: input.rating || null, note: input.note || '', setlist: input.setlist || [], fromMemory: !!input.fromMemory });
    save(); return hydrate(e);
  },
  async deleteEntry(id) {
    await delay(30);
    const u = needMe(); const e = db.entries.find((x) => x.id === id);
    if (!e || e.userId !== u.id) throw new Error('You can only delete your own shows.');
    db.entries = db.entries.filter((x) => x.id !== id); db.likes = db.likes.filter(([, eid]) => eid !== id); db.comments = (db.comments || []).filter((c) => c.entryId !== id); save();
  },
  async setLike(entryId, on) {
    const u = needMe(); db.likes = db.likes.filter(([a, b]) => !(a === u.id && b === entryId));
    if (on) db.likes.push([u.id, entryId]); save();
    return db.likes.filter(([, b]) => b === entryId).length;
  },

  async listComments(entryId) {
    await delay(30);
    return (db.comments || []).filter((c) => c.entryId === entryId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(mapComment);
  },
  async addComment(entryId, body) {
    const u = needMe(); const text = String(body || '').trim().slice(0, 500);
    if (!text) throw new Error('Write something first.');
    const c = { id: 'c_' + uid().slice(0, 8), entryId, userId: u.id, body: text, createdAt: new Date().toISOString() };
    db.comments.push(c); save(); return mapComment(c);
  },
  async deleteComment(id) {
    const u = needMe(); const c = db.comments.find((x) => x.id === id);
    if (!c || c.userId !== u.id) throw new Error('You can only delete your own comments.');
    db.comments = db.comments.filter((x) => x.id !== id); save();
  },
  async suggestPeople(limit = 5) {
    await delay(30);
    const m = me();
    const rest = db.users.filter((u) => u.id !== m?.id && !iFollow(u.id));
    return peopleList(rest.map((u) => u.id), m?.id, 'suggest').slice(0, limit);
  },

  async listActivity() {
    await delay(30);
    const m = needMe();
    return db.activity.filter((a) => a.targetId === m.id && a.actorId !== m.id).sort((a, b) => b.at.localeCompare(a.at)).map((a) => {
      const u = db.users.find((x) => x.id === a.actorId) || {}; const e = a.entryId ? db.entries.find((x) => x.id === a.entryId) : null;
      const sh = e ? db.shows.find((x) => x.id === e.showId) : null; const art = sh ? db.artists.find((x) => x.id === sh.artistId) : null;
      const own = e ? db.photos.find((p) => p.showId === e.showId && p.uploaderId === e.userId) : null;
      const top = !own && art ? db.photos.filter((p) => db.shows.find((x) => x.id === p.showId)?.artistId === art.id).sort((x, y) => (y.votes || 0) - (x.votes || 0))[0] : null;
      return { id: a.id, type: a.type, actorId: u.id, following: db.follows.some(([f, t]) => f === m.id && t === u.id), actorName: u.username || 'someone', actorAvatar: u.avatarUrl || '', entryId: a.entryId, artistName: art?.name || '', photoUrl: (own || top)?.url || '', body: a.body, createdAt: a.at };
    });
  },
  async votePhoto(photoId, on) {
    const m = needMe(); const p = db.photos.find((x) => x.id === photoId); if (!p) throw new Error('Photo not found.');
    if (p.uploaderId === m.id) throw new Error('You can’t vote for your own photo.');
    const sameShow = db.photos.filter((x) => x.showId === p.showId).map((x) => x.id);
    db.photoVotes = db.photoVotes.filter(([u, pid]) => !(u === m.id && sameShow.includes(pid)));
    if (on) db.photoVotes.push([m.id, photoId]);
    save(); return hydratePhoto(p);
  },

  async setFollow(userId, on) {
    await delay(30);
    const u = needMe(); if (userId === u.id) throw new Error('You can’t follow yourself.');
    db.follows = db.follows.filter(([a, b]) => !(a === u.id && b === userId));
    if (on) db.follows.push([u.id, userId]); save();
  },
  async listFollowers(userId) { await delay(); return peopleList(db.follows.filter(([, b]) => b === userId).map(([a]) => a), userId, 'followers'); },
  async listFollowing(userId) { await delay(); return peopleList(db.follows.filter(([a]) => a === userId).map(([, b]) => b), userId, 'following'); },

  async getArtist(id) {
    await delay(30);
    const a = db.artists.find((x) => x.id === id); if (!a) return null;
    const m = me();
    return { id: a.id, name: a.name, genres: a.genres || [], followerCount: db.artistFollows.filter(([, x]) => x === id).length, followedByMe: !!m && db.artistFollows.some(([u, x]) => u === m.id && x === id) };
  },
  async setFollowArtist(artistId, on) {
    const u = needMe(); db.artistFollows = db.artistFollows.filter(([a, b]) => !(a === u.id && b === artistId));
    if (on) db.artistFollows.push([u.id, artistId]); save();
  },
  async getShow(id) {
    await delay(30);
    const s = db.shows.find((x) => x.id === id); if (!s) return null;
    const a = db.artists.find((x) => x.id === s.artistId) || {}, v = db.venues.find((x) => x.id === s.venueId) || {};
    return { id: s.id, artistId: a.id, artistName: a.name, venueId: v.id, venueName: v.name, city: v.city || '', date: s.date };
  },
  async getVenue(id) { const v = db.venues.find((x) => x.id === id); return v ? { id: v.id, name: v.name, city: v.city || '' } : null; },
  async listShows({ artistId, venueId } = {}) {
    await delay();
    return db.shows.filter((s) => (!artistId || s.artistId === artistId) && (!venueId || s.venueId === venueId)).map((s) => {
      const es = db.entries.filter((e) => e.showId === s.id && canSee(e.userId));
      const rs = es.map((e) => e.rating).filter(Boolean);
      const a = db.artists.find((x) => x.id === s.artistId) || {}, v = db.venues.find((x) => x.id === s.venueId) || {};
      return { id: s.id, artistId: a.id, artistName: a.name, venueId: v.id, venueName: v.name, city: v.city || '', date: s.date, logCount: es.length, avgRating: rs.length ? rs.reduce((x, y) => x + y, 0) / rs.length : null };
    }).filter((s) => s.logCount > 0).sort((a, b) => b.date.localeCompare(a.date));
  },
  async listPhotos({ artistId, showId } = {}) {
    await delay(30);
    return db.photos.filter((p) => { const s = db.shows.find((x) => x.id === p.showId); return s && (p.uploaderId === me()?.id || canSee(p.uploaderId)) && (!artistId || s.artistId === artistId) && (!showId || p.showId === showId); }).map(hydratePhoto).sort((a, b) => b.votes - a.votes);
  },
  async uploadPhoto(showId, file, onProgress) {
    const u = needMe();
    const { blob } = await compressPhoto(file, onProgress);
    onProgress?.('uploading');
    const url = await blobToDataUrl(blob);
    const p = { userMade: true, id: 'p_' + uid().slice(0, 8), showId, uploaderId: u.id, url, votes: 0, createdAt: new Date().toISOString() };
    db.photos.push(p);
    try { save(); } catch (e) { db.photos.pop(); throw e; }
    onProgress?.('complete'); return hydratePhoto(p);
  },
  async uploadAvatar(file) {
    needMe(); const { blob } = await compressPhoto(file, null, { maxDim: 320, targetBytes: 40 * 1024 });
    return blobToDataUrl(blob);
  },
  async acceptUgcLicense() { const u = needMe(); u.agreedToUgc = true; save(); },

  async search(q, type = 'all') {
    await delay(40);
    const n = norm(q); const out = [];
    if (!n) return out;
    if (type === 'all' || type === 'artist') db.artists.filter((a) => fuzzyMatch(a.name, q)).forEach((a) => out.push({ type: 'artist', id: a.id, name: a.name, sub: (a.genres || []).join(', ') || `${db.shows.filter((s) => s.artistId === a.id).length} shows` }));
    if (type === 'all' || type === 'venue') db.venues.filter((v) => fuzzyMatch(v.name, q)).forEach((v) => out.push({ type: 'venue', id: v.id, name: v.name, sub: v.city || '' }));
    if (type === 'all' || type === 'user') db.users.filter((u) => fuzzyMatch(u.username, q) || fuzzyMatch(u.displayName || '', q)).forEach((u) => out.push({ type: 'user', id: u.id, name: u.username, sub: u.displayName || '', avatarUrl: u.avatarUrl }));
    return out.slice(0, 40);
  },
  async topArtists(limit = 8) {
    await delay(30);
    const m = new Map();
    db.entries.forEach((e) => { if (!canSee(e.userId)) return; const s = db.shows.find((x) => x.id === e.showId); if (s) m.set(s.artistId, (m.get(s.artistId) || 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id, n]) => ({ id, name: db.artists.find((a) => a.id === id)?.name, logs: n }));
  },
  async suggestions() {
    return { artists: db.artists.map((a) => a.name).sort(), venues: db.venues.map((v) => ({ name: v.name, city: v.city || '' })).sort((a, b) => a.name.localeCompare(b.name)) };
  }
};

function peopleList(ids, ownerId, kind) {
  const m = me();
  return ids.map((id) => db.users.find((u) => u.id === id)).filter(Boolean).map((u) => ({
    id: u.id, username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl, isMe: m?.id === u.id,
    isFollowing: iFollow(u.id), followsMe: !!m && db.follows.some(([a, b]) => a === u.id && b === m.id),
    shows: db.entries.filter((e) => e.userId === u.id).length,
    topArtists: topArtistNames(u.id)
  }));
}
function topArtistNames(userId) {
  const c = new Map();
  db.entries.filter((e) => e.userId === userId).forEach((e) => { const s = db.shows.find((x) => x.id === e.showId); const n = db.artists.find((a) => a.id === s?.artistId)?.name; if (n) c.set(n, (c.get(n) || 0) + 1); });
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n);
}

function mapComment(c) {
  const u = db.users.find((x) => x.id === c.userId) || {};
  return { id: c.id, entryId: c.entryId, userId: c.userId, username: u.username || 'unknown', avatarUrl: u.avatarUrl || '', body: c.body, createdAt: c.createdAt, mine: me()?.id === c.userId };
}
