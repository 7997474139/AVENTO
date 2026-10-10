// ఫ్రెష్ మీట్ డెలివరీ కేటగిరీలు మరియు ఐటమ్స్ (ప్రస్తుతానికి ధరలు లేవు, కేవలం కిలోలు)
const freshMeatMenu = {
    serviceName: "🥩 Fresh Meat Delivery",
    categories: [
        {
            id: "meat_boiler",
            title: "🐓 బాయిలర్ కోడి (Broiler Chicken)",
            items: [
                { id: "b_chicken", name: "Broiler Chicken (Full Cleaned)" }
            ]
        },
        {
            id: "meat_country",
            title: "🐔 నాటుకోడి (Country Chicken)",
            items: [
                { id: "c_chicken", name: "Country Chicken (Natu Kodi)" }
            ]
        },
        {
            id: "meat_mutton",
            title: "🐐 ఫ్రెష్ మటన్ (Fresh Mutton / Goat)",
            items: [
                { id: "g_mutton", name: "Fresh Goat Mutton" }
            ]
        }
    ],
    // 1 నుండి 10 కిలోల వరకు ఎంపిక చేసుకోవడానికి ఆప్షన్స్
    quantities: [
        { id: "qty_1", title: "1 కిలో (1 KG)" },
        { id: "qty_2", title: "2 కిలోలు (2 KG)" },
        { id: "qty_3", title: "3 కిలోలు (3 KG)" },
        { id: "qty_4", title: "4 కిలోలు (4 KG)" },
        { id: "qty_5", title: "5 కిలోలు (5 KG)" },
        { id: "qty_6", title: "6 కిలోలు (6 KG)" },
        { id: "qty_7", title: "7 కిలోలు (7 KG)" },
        { id: "qty_8", title: "8 కిలోలు (8 KG)" },
        { id: "qty_9", title: "9 కిలోలు (9 KG)" },
        { id: "qty_10", title: "10 కిలోలు (10 KG)" }
    ]
};

module.exports = freshMeatMenu;