/**
 * ZEKRA CONSTANTS & DEFAULTS v4.4.1
 * Centralized configuration for the entire application.
 */
window.ZEKRA = window.ZEKRA || {};

// ─── Database Keys ───────────────────────────────────────────
ZEKRA.DB_ID_PREFIX = 'ZK_VX_';
ZEKRA.SESSION_KEY = 'zekra_session_id';
ZEKRA.VERSION = '4.4.1';

// ─── Master Credentials (loaded from DB at runtime) ──────────
ZEKRA.MASTER_EMAIL = "admin_zekra_9454@zekra.com";
ZEKRA.MASTER_USERNAME = "admin_zekra_9454";
ZEKRA.MASTER_PASSWORD = "Master2026!";
ZEKRA.RECOVERY_MASTER_USER = "zekra_master";
ZEKRA.RECOVERY_MASTER_PASS = "Master2026!";

// ─── SVG Fallbacks ───────────────────────────────────────────
ZEKRA.SVG_GOLD = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fbbf24'><path d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/></svg>";
ZEKRA.SVG_ROSE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f9a8d4'><path d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/></svg>";

// ─── Default Placeholders ────────────────────────────────────
ZEKRA.PLACEHOLDER_IMAGES = [
    "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400",
    "https://images.unsplash.com/photo-1516589174184-c685266d430c?w=400"
];
ZEKRA.DEFAULT_FLOAT = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200";
ZEKRA.DEFAULT_MOOD = "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=200";
ZEKRA.DEFAULT_ART = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200";
ZEKRA.DEFAULT_MEMORY = "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=400";

// ─── Cloudinary Config ───────────────────────────────────────
ZEKRA.CLOUDINARY = {
    CLOUD_NAME: 'dtxzjtlju',
    UPLOAD_PRESET: 'zekra_vault_media',
    IMAGE_ENDPOINT: 'https://api.cloudinary.com/v1_1/dtxzjtlju/image/upload',
    VIDEO_ENDPOINT: 'https://api.cloudinary.com/v1_1/dtxzjtlju/video/upload'
};

// ─── Firebase Paths ──────────────────────────────────────────
ZEKRA.FB_PATHS = {
    USERS: 'users',
    ORDERS: 'zekra_orders',
    ORDERS_DB: 'orders_database',
    PRESENCE: 'presence',
    PEACE_TREATY: 'peace_treaty',
    RECONCILIATION: 'reconciliation_board',
    SYSTEM_BROADCAST: 'system/broadcast',
    ADMIN_CONFIG: 'admin_config/master',
    MASTER_LOGS: 'master_logs/logins'
};

// ─── Default Vault State ─────────────────────────────────────
ZEKRA.DEFAULT_VAULT = {
    n: "Soulmates",
    w: "Our Story",
    m: "Welcome to our sanctuary...",
    s: "Lovesong",
    a: "https://open.spotify.com/track/7s25THrKz86PI223H",
    c: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/94/d2/ba/94d2bacf-07d7-df79-24a3-7fbf5207c848/081227981303.jpg/100x100bb.jpg",
    ig: "#", tk: "#", sp: "#",
    color: "#FF7096",
    float: "https://placehold.co/400x400/FF7096/white?text=Logo",
    bg: "#FCE4EC",
    dim: false,
    pixel: true,
    c1t: "Our First Date",
    c1s: "October 10, 2024 ♡",
    c1b: "",
    c1f: "'Montserrat'",
    c2t: "Admin Card 2",
    c2s: "Coming soon... 🌸",
    c2b: "",
    userNameFont: "'Nunito'",
    longMessage: "",
    bigFont: "'Nunito'",
    moodImg: "https://placehold.co/600x400/FF7096/white?text=Mood",
    moodReasons: "De7ketek | Lama bet5a_fy 3alya",
    moodFont: "'Indie Flower'",
    lyrics: "I love you forever...",
    title: "Memory Song",
    artist: "Artist",
    art: "https://placehold.co/400x400/FF7096/white?text=Song+Art",
    spotifyStyle: "spot-style-1",
    d: "2026-10-10T00:00",
    dm: "You make my heart smile perfectly ❤️",
    sd: "2024-10-10",
    g: [
        { url: "https://placehold.co/600x400/FF7096/white?text=Memory+1", cap: "Best day ever💕" },
        { url: "https://placehold.co/600x400/FF7096/white?text=Memory+2", cap: "Memories..." },
        { url: "https://placehold.co/600x400/FF7096/white?text=Memory+3", cap: "Infinity ♾️" }
    ],
    o: { msc: 1, gal: 2, stt: 3, qts: 4, map: 5, emg: 6, wal: 7 },
    y_nick: "Little Prince",
    m_n: "Soulmate",
    m_img: "",
    m_nick: "Little Princess",
    xp_yossif: 450,
    xp_marium: 450,
    anniversary: "2023-01-01",
    coins_marium: 100,
    galleryLimit: 5,
    storyUnlocked: false,
    musicSwitches: 0,
    ownedItems: {},
    purchasedFonts: { marium: {}, yossif: {} },
    products: [
        { id: 'extra_photo_1', name: '1 Extra Photo Slot', icon: '🖼️', cost: 100, type: 'upgrade', cat: 'Upgrades' },
        { id: 'extra_photo_10', name: 'Mega Photo Pack (+10)', icon: '📸', cost: 1000, type: 'upgrade', cat: 'Upgrades' },
        { id: 'music_switcher', name: 'Music Switcher', icon: '🎵', cost: 100, type: 'consumable', cat: 'Upgrades' },
        { id: 'story_editor', name: 'Story Editor Access', icon: '✍️', cost: 200, type: 'unlock', cat: 'Upgrades' },
        { id: 'msg_editor', name: 'Premium Message Edit', icon: '📝', cost: 100, type: 'action', cat: 'Upgrades' }
    ]
};

// ─── Font Products (injected dynamically) ────────────────────
ZEKRA.FONT_PRODUCTS = [
    { id: 'font_bodyText', name: 'Main Body Font', icon: '📝', cost: 25, type: 'font', cat: 'Fonts' },
    { id: 'font_welcomeMessage', name: 'Welcome Message Font', icon: '✨', cost: 25, type: 'font', cat: 'Fonts' },
    { id: 'font_storeWord', name: 'Store Title Font', icon: '🛒', cost: 25, type: 'font', cat: 'Fonts' },
    { id: 'font_ourNames', name: 'Our Names Font', icon: '👨‍👩‍👧', cost: 25, type: 'font', cat: 'Fonts' },
    { id: 'font_noteSection', name: 'Note Header Font', icon: '📓', cost: 25, type: 'font', cat: 'Fonts' },
    { id: 'font_whyYouMad', name: 'Why You Mad Font', icon: '😡', cost: 25, type: 'font', cat: 'Fonts' }
];

// ─── Recharge Packages ───────────────────────────────────────
ZEKRA.RECHARGE_PACKS = [
    { coins: 100, egp: 20 },
    { coins: 250, egp: 50 },
    { coins: 500, egp: 100 },
    { coins: 1000, egp: 200 }
];

// ─── Missions ────────────────────────────────────────────────
ZEKRA.MISSIONS = [
    { t: "We Met", i: "heart-3-fill", c: "pink", xp: 0 },
    { t: "First Message", i: "chat-3-fill", c: "blue", xp: 50 },
    { t: "First Phone Call", i: "phone-fill", c: "green", xp: 80 },
    { t: "First Video Call", i: "video-fill", c: "pink", xp: 100 },
    { t: "Initial Spark", i: "sparkling-fill", c: "yellow", xp: 150 },
    { t: "First Date", i: "cup-fill", c: "pink", xp: 200 },
    { t: "Movie Night", i: "movie-2-fill", c: "purple", xp: 250 },
    { t: "First Gift", i: "gift-fill", c: "red", xp: 300 },
    { t: "Shared Playlist", i: "music-fill", c: "blue", xp: 350 },
    { t: "Inside Joke", i: "emotion-laugh-fill", c: "yellow", xp: 400 },
    { t: "Sunset Walk", i: "sun-fill", c: "orange", xp: 450 },
    { t: "Late Night Talk", i: "moon-fill", c: "purple", xp: 500 },
    { t: "First Photo", i: "camera-fill", c: "pink", xp: 550 },
    { t: "First Trip", i: "flight-takeoff-line", c: "orange", xp: 600 },
    { t: "Meeting Friends", i: "group-fill", c: "blue", xp: 650 },
    { t: "Cooking Together", i: "restaurant-fill", c: "green", xp: 700 },
    { t: "Stargazing", i: "blaze-fill", c: "purple", xp: 750 },
    { t: "Shared Secret", i: "lock-fill", c: "pink", xp: 800 },
    { t: "First I Love You", i: "heart-pulse-fill", c: "red", xp: 850 },
    { t: "Beach Day", i: "sun-cloudy-fill", c: "blue", xp: 900 },
    { t: "Picnic Date", i: "cake-fill", c: "pink", xp: 950 },
    { t: "Shopping Spree", i: "shopping-bag-fill", c: "orange", xp: 1000 },
    { t: "Gaming Session", i: "gamepad-fill", c: "purple", xp: 1050 },
    { t: "Rainy Day Cuddles", i: "cloud-rain-fill", c: "blue", xp: 1100 },
    { t: "Morning Text", i: "notification-3-fill", c: "pink", xp: 1150 },
    { t: "Night Call", i: "customer-service-2-fill", c: "green", xp: 1200 },
    { t: "First Anniversary", i: "medal-fill", c: "gold", xp: 1300 },
    { t: "Surprise Flowers", i: "flower-fill", c: "red", xp: 1350 },
    { t: "Deep Conversation", i: "brain-fill", c: "blue", xp: 1400 },
    { t: "Silly Dancing", i: "music-2-fill", c: "pink", xp: 1450 },
    { t: "Road Trip", i: "car-fill", c: "orange", xp: 1500 },
    { t: "Coffee Date", i: "cup-line", c: "black", xp: 1550 },
    { t: "Library Study", i: "book-fill", c: "blue", xp: 1600 },
    { t: "Park Walk", i: "leaf-fill", c: "green", xp: 1650 },
    { t: "Museum Visit", i: "bank-fill", c: "gray", xp: 1700 },
    { t: "Art Gallery", i: "palette-fill", c: "pink", xp: 1750 },
    { t: "Concert Night", i: "mic-fill", c: "red", xp: 1800 },
    { t: "Karaoke Fun", i: "volume-up-fill", c: "orange", xp: 1850 },
    { t: "Theme Park", i: "ticket-fill", c: "purple", xp: 1900 },
    { t: "Zoo Visit", i: "guide-fill", c: "green", xp: 1950 },
    { t: "Aquarium Trip", i: "anchor-fill", c: "blue", xp: 2000 },
    { t: "Pizza Night", i: "fire-fill", c: "red", xp: 2050 },
    { t: "Sushi Date", i: "instance-fill", c: "pink", xp: 2100 },
    { t: "Fancy Dinner", i: "mickey-fill", c: "yellow", xp: 2150 },
    { t: "Homemade Cake", i: "cake-3-fill", c: "pink", xp: 2200 },
    { t: "Breakfast in Bed", i: "bread-fill", c: "orange", xp: 2250 },
    { t: "Matching Outfits", i: "shirt-fill", c: "blue", xp: 2300 },
    { t: "Photo Album", i: "book-2-fill", c: "pink", xp: 2350 },
    { t: "Love Letter", i: "mail-open-fill", c: "red", xp: 2400 },
    { t: "Hand-Holding", i: "shake-hands-fill", c: "pink", xp: 2450 },
    { t: "First Fight Fix", i: "shield-check-fill", c: "green", xp: 2500 },
    { t: "Growing Stronger", i: "line-chart-fill", c: "blue", xp: 2550 },
    { t: "Future Plans", i: "earth-fill", c: "blue", xp: 2600 },
    { t: "Dreaming Together", i: "cloud-fill", c: "pink", xp: 2650 },
    { t: "Building Trust", i: "hammer-fill", c: "blue", xp: 2700 },
    { t: "Keeping Promises", i: "safe-2-fill", c: "pink", xp: 2750 },
    { t: "Supporting Goals", i: "rocket-fill", c: "red", xp: 2800 },
    { t: "Celebrating Wins", i: "trophy-fill", c: "gold", xp: 2850 },
    { t: "Comforting Sadness", i: "hand-heart-fill", c: "pink", xp: 2900 },
    { t: "First New Year", i: "calendar-check-fill", c: "blue", xp: 3000 },
    { t: "Valentine's Day", i: "heart-add-fill", c: "red", xp: 3100 },
    { t: "Birthday Surprise", i: "balloon-fill", c: "pink", xp: 3200 },
    { t: "Giving Strength", i: "flashlight-fill", c: "yellow", xp: 3300 },
    { t: "Patient Love", i: "time-fill", c: "blue", xp: 3400 },
    { t: "Endless Laughter", i: "emotion-happy-fill", c: "pink", xp: 3500 },
    { t: "Best Friends", i: "user-heart-fill", c: "blue", xp: 3600 },
    { t: "Soulmates", i: "infinity-fill", c: "purple", xp: 3700 },
    { t: "Forever Vow", i: "shield-star-fill", c: "gold", xp: 3800 },
    { t: "Morning Coffee", i: "cup-fill", c: "brown", xp: 3900 },
    { t: "Evening Tea", i: "cup-line", c: "green", xp: 4000 },
    { t: "Watching Stars", i: "shining-2-fill", c: "blue", xp: 4100 },
    { t: "Walking in Snow", i: "temp-cold-fill", c: "white", xp: 4200 },
    { t: "Autumn Leaves", i: "leaf-fill", c: "orange", xp: 4300 },
    { t: "Spring Flowers", i: "seedling-fill", c: "green", xp: 4400 },
    { t: "Summer Breeze", i: "windy-fill", c: "blue", xp: 4500 },
    { t: "Winter Warmth", i: "home-8-fill", c: "brown", xp: 4600 },
    { t: "Shared Hoodie", i: "t-shirt-2-fill", c: "blue", xp: 4700 },
    { t: "Sweet Dreams", i: "mickey-fill", c: "pink", xp: 4800 },
    { t: "Waking Up to You", i: "sun-line", c: "yellow", xp: 4900 },
    { t: "Every Second Counts", i: "timer-flash-fill", c: "red", xp: 5000 },
    { t: "Timeless Love", i: "history-fill", c: "blue", xp: 5100 },
    { t: "Infinite Bonds", i: "link-m", c: "pink", xp: 5200 },
    { t: "Golden Memories", i: "copper-coin-fill", c: "gold", xp: 5300 },
    { t: "Diamond Soul", i: "vip-diamond-fill", c: "blue", xp: 5400 },
    { t: "Platinum Heart", i: "medal-2-fill", c: "white", xp: 5500 },
    { t: "Crystal Clear", i: "shapes-fill", c: "pink", xp: 5600 },
    { t: "Pure Love", i: "water-flash-fill", c: "blue", xp: 5700 },
    { t: "Unconditional", i: "shield-keyhole-fill", c: "green", xp: 5800 },
    { t: "Beyond Words", i: "bubble-chart-fill", c: "pink", xp: 5900 },
    { t: "Heartbeat Sync", i: "pulse-fill", c: "red", xp: 6000 },
    { t: "True Devotion", i: "star-fill", c: "yellow", xp: 6100 },
    { t: "Sacred Union", i: "building-4-fill", c: "pink", xp: 6200 },
    { t: "Eternal Flame", i: "fire-fill", c: "orange", xp: 6300 },
    { t: "Galaxy of Dreams", i: "rocket-2-fill", c: "blue", xp: 6400 },
    { t: "Universe of Us", i: "global-fill", c: "green", xp: 6500 },
    { t: "Destiny Written", i: "ball-pen-fill", c: "pink", xp: 6600 },
    { t: "Final Piece", i: "puzzle-fill", c: "red", xp: 6700 },
    { t: "Complete Soul", i: "ghost-smile-fill", c: "pink", xp: 6800 },
    { t: "Endless Journey", i: "road-map-fill", c: "green", xp: 6900 },
    { t: "Our Forever", i: "heart-3-fill", c: "red", xp: 7000 }
];

// ─── Theme Definitions ───────────────────────────────────────
ZEKRA.THEMES = {
    'soft-rose': { accent: '#f9a8d4', grad: 'linear-gradient(135deg, #fff5f7, #fce4ec)', bubbleMe: 'rgba(249, 168, 212, 0.3)', bubbleThem: 'rgba(0, 0, 0, 0.05)', text: '#1e293b' },
    'midnight-gold': { accent: '#fbbf24', grad: 'linear-gradient(135deg, #0f172a, #1a2a44)', bubbleMe: 'rgba(251, 191, 36, 0.3)', bubbleThem: 'rgba(255, 255, 255, 0.1)', text: '#fff' },
    'ocean-blue': { accent: '#60a5fa', grad: 'linear-gradient(135deg, #eff6ff, #dbeafe)', bubbleMe: 'rgba(96, 165, 250, 0.3)', bubbleThem: 'rgba(0, 0, 0, 0.05)', text: '#1e293b' },
    'emerald-green': { accent: '#34d399', grad: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', bubbleMe: 'rgba(52, 211, 153, 0.3)', bubbleThem: 'rgba(0, 0, 0, 0.05)', text: '#064e3b' },
    'amethyst-purple': { accent: '#a78bfa', grad: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', bubbleMe: 'rgba(167, 139, 250, 0.3)', bubbleThem: 'rgba(0, 0, 0, 0.05)', text: '#1e293b' },
    'silver-mist': { accent: '#94a3b8', grad: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', bubbleMe: 'rgba(148, 163, 184, 0.3)', bubbleThem: 'rgba(0, 0, 0, 0.05)', text: '#1e293b' },
    'sunset-orange': { accent: '#fb923c', grad: 'linear-gradient(135deg, #fff7ed, #ffedd5)', bubbleMe: 'rgba(251, 146, 60, 0.3)', bubbleThem: 'rgba(0, 0, 0, 0.05)', text: '#1e293b' },
    'crimson-velvet': { accent: '#f87171', grad: 'linear-gradient(135deg, #450a0a, #7f1d1d)', bubbleMe: 'rgba(248, 113, 113, 0.3)', bubbleThem: 'rgba(255, 255, 255, 0.1)', text: '#fff' },
    'icy-white': { accent: '#7dd3fc', grad: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', bubbleMe: 'rgba(125, 211, 252, 0.4)', bubbleThem: 'rgba(0, 0, 0, 0.05)', text: '#0c4a6e' },
    'noir-lux': { accent: '#d4d4d8', grad: 'linear-gradient(135deg, #18181b, #27272a)', bubbleMe: 'rgba(255, 255, 255, 0.15)', bubbleThem: 'rgba(255, 255, 255, 0.05)', text: '#fff' }
};

// ─── Mission Aliases (for auto-unlock) ───────────────────────
ZEKRA.MISSION_ALIASES = {
    "Movie Night": ["cinema", "movie", "film"],
    "Coffee Date": ["coffee", "cafe", "starbucks"],
    "Pizza Night": ["pizza"],
    "Sushi Date": ["sushi"],
    "First Date": ["first date"],
    "Sunset Walk": ["sunset", "walk"],
    "Late Night Talk": ["late night", "stayed up"],
    "Shopping Spree": ["shopping", "mall"]
};

// ─── Initial Products (for admin editor) ─────────────────────
ZEKRA.INITIAL_PRODUCTS = [
    { id: 'extra_photo_1', name: '1 Extra Photo Slot', cost: 100, type: 'upgrade', cat: 'Upgrades', icon: '🖼️' },
    { id: 'extra_photo_10', name: 'Mega Photo Pack (+10)', cost: 1000, type: 'upgrade', cat: 'Upgrades', icon: '📸' },
    { id: 'music_switcher', name: 'Music Switcher', cost: 100, type: 'consumable', cat: 'Upgrades', icon: '🎵' },
    { id: 'story_editor', name: 'Story Editor Access', cost: 200, type: 'unlock', cat: 'Upgrades', icon: '✍️' },
    { id: 'p1', name: 'Midnight Rose', cost: 500, type: 'theme', cat: 'Themes', category: 'Themes', icon: '🌹' },
    { id: 'p2', name: 'Neon Cyber', cost: 700, type: 'theme', cat: 'Themes', category: 'Themes', icon: '🌃' },
    { id: 'p3', name: 'Vintage Polaroid', cost: 400, type: 'theme', cat: 'Themes', category: 'Themes', icon: '📸' },
    { id: 'p4', name: 'Floating Hearts', cost: 300, type: 'effect', cat: 'Effects', category: 'Effects', icon: '💖' },
    { id: 'p5', name: 'Starry Sky', cost: 450, type: 'effect', cat: 'Effects', category: 'Effects', icon: '⭐' },
    { id: 'p6', name: 'Snowfall', cost: 250, type: 'effect', cat: 'Effects', category: 'Effects', icon: '❄️' }
];

console.log('✅ ZEKRA: Constants loaded.');