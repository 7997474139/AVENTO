require("dotenv").config();

const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const mime = require("mime-types");
const express = require("express");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

const brindavanMenu = require("./services/brindavanMenu");
const freshMeatMenu = require("./services/freshMeatMenu");

const app = express();
app.use(express.json({ limit: "10mb" }));

const {
  PORT = 3000,
  VERIFY_TOKEN,
  WHATSAPP_TOKEN,
  PHONE_NUMBER_ID,
  SUPABASE_URL,
  SUPABASE_KEY,
  AVENTO_UPI_ID = "9550665977-5@ybl",
  AVENTO_UPI_NAME = "Avento Multi-Services",
  AVENTO_ADMIN_PHONE = "919550665977",
  RESEND_API_KEY,
  ADMIN_EMAIL = "smahesh0404@gmail.com",
} = process.env;

const GRAPH_VERSION = "v23.0";
const GRAPH_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;

if (
  !VERIFY_TOKEN ||
  !WHATSAPP_TOKEN ||
  !PHONE_NUMBER_ID ||
  !SUPABASE_URL ||
  !SUPABASE_KEY
) {
  console.error("Missing required environment variables in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==================================================
// RESEND API CLIENT SETUP
// ==================================================
const resend = new Resend(RESEND_API_KEY);

async function sendOrderEmail(subject, htmlContent) {
  if (!RESEND_API_KEY || !ADMIN_EMAIL) {
    console.warn("Resend API key or Admin email not configured properly.");
    return;
  }

  try {
    await resend.emails.send({
      from: "Avento Bot <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: subject,
      html: htmlContent,
    });
    console.log("✅ ఆర్డర్ ఈమెయిల్ Resend API ద్వారా విజయవంతంగా పంపబడింది!");
  } catch (error) {
    console.error("❌ ఈమెయిల్ పంపడంలో ఎర్రర్ వచ్చింది:", error);
  }
}

// ==================================================
// 1. HELPERS & DISTANCE / DELIVERY FEE LOGIC
// ==================================================

const RESTAURANT_LAT = 13.951505;
const RESTAURANT_LNG = 79.356579;

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // కిమీలలో భూమి వ్యాసార్థం
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateDeliveryFee(distanceInKm) {
  if (distanceInKm <= 2) {
    return 30; // మొదటి 2 కిమీలకు ₹30
  } else {
    return Math.round(30 + (distanceInKm - 2) * 10); // ఆపై ప్రతి కిమీకి ₹10 అదనంగా
  }
}

function formatRupees(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function normalize(value = "") {
  return String(value).trim().toLowerCase();
}

function normalizePhone(value = "") {
  return String(value).replace(/\D/g, "");
}

function getCart(user) {
  return Array.isArray(user?.cart) ? user.cart : [];
}

function getTemp(user) {
  const value = user?.temp_selection;

  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function getLocation(user) {
  return user?.location || null;
}

function getFoodCategories() {
  return Array.isArray(brindavanMenu.categories)
    ? brindavanMenu.categories
    : [];
}

function getMeatCategories() {
  return Array.isArray(freshMeatMenu.categories)
    ? freshMeatMenu.categories
    : [];
}

function getFoodItem(itemId) {
  return getFoodCategories()
    .flatMap(category => category.items || [])
    .find(item => String(item.id) === String(itemId));
}

function getMeatItem(itemId) {
  return getMeatCategories()
    .flatMap(category => category.items || [])
    .find(item => String(item.id) === String(itemId));
}

function getCartTotal(cart) {
  return cart.reduce((total, item) => {
    if (item.price_pending) return total;

    return (
      total +
      Number(item.price || 0) * Number(item.quantity || 1)
    );
  }, 0);
}

function parseOrderDetails(details) {
  if (!details) return {};

  if (typeof details === "object" && !Array.isArray(details)) {
    return details;
  }

  try {
    return JSON.parse(details);
  } catch {
    return {};
  }
}

function isAdmin(phone) {
  const configured = normalizePhone(AVENTO_ADMIN_PHONE);

  return Boolean(configured) && normalizePhone(phone) === configured;
}

function serviceImage(filename) {
  return path.join(__dirname, "assets", filename);
}

function getServiceName(service) {
  const names = {
    food: "Food Order",
    fresh_meat: "Fresh Meat Delivery",
    medicine: "Medicine Order",
    plumbing_electrical: "Home Repairs",
    shifting: "Home Shifting / Parcel",
  };

  return names[service] || "Avento Multi-Services";
}

// ==================================================
// 2. WHATSAPP API & IMAGES
// ==================================================

async function sendWhatsApp(payload) {
  try {
    const response = await axios.post(
      `${GRAPH_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        ...payload,
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "WhatsApp API error:",
      error.response?.data || error.message
    );

    throw error;
  }
}

async function sendText(to, body) {
  return sendWhatsApp({
    to,
    type: "text",
    text: { body },
  });
}

async function uploadWhatsAppImage(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Image file not found: ${filePath}`);
  }

  const contentType = mime.lookup(filePath);

  if (!contentType) {
    throw new Error(`Unsupported image file: ${filePath}`);
  }

  const form = new FormData();

  form.append("messaging_product", "whatsapp");
  form.append("file", fs.createReadStream(filePath), {
    contentType,
    filename: path.basename(filePath),
  });
  form.append("type", contentType);

  const response = await axios.post(
    `${GRAPH_URL}/${PHONE_NUMBER_ID}/media`,
    form,
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        ...form.getHeaders(),
      },
      timeout: 30000,
    }
  );

  return response.data.id;
}

async function sendLocalImage(phone, filePath, caption = "") {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn("Image file missing:", filePath);
      return false;
    }

    const mediaId = await uploadWhatsAppImage(filePath);

    await sendWhatsApp({
      to: phone,
      type: "image",
      image: {
        id: mediaId,
        ...(caption ? { caption } : {}),
      },
    });

    return true;
  } catch (error) {
    console.error(
      "Failed to send image:",
      error.response?.data || error.message
    );

    return false;
  }
}

async function sendButtons(to, body, buttons) {
  return sendWhatsApp({
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: {
        buttons: buttons.slice(0, 3).map(button => ({
          type: "reply",
          reply: {
            id: button.id,
            title: button.title.slice(0, 20),
          },
        })),
      },
    },
  });
}

async function sendNavigation(to) {
  try {
    await sendButtons(
      to,
      "⬇️ మరిన్ని ఎంపికలు",
      [
        { id: "nav_back", title: "⬅️ Back" },
        { id: "nav_main", title: "🏠 Main Menu" },
      ]
    );
  } catch (error) {
    console.error("Navigation buttons error:", error.message);
  }
}

async function sendList(to, body, buttonText, sections) {
  const safeSections = sections
    .map(section => ({
      title: String(section.title || "Options").slice(0, 24),
      rows: (section.rows || []).slice(0, 10).map(row => ({
        id: String(row.id),
        title: String(row.title || "Option").slice(0, 24),
        ...(row.description
          ? { description: String(row.description).slice(0, 72) }
          : {}),
      })),
    }))
    .filter(section => section.rows.length);

  if (!safeSections.length) {
    await sendText(
      to,
      "ప్రస్తుతం ఎంపికలు అందుబాటులో లేవు. కొద్దిసేపటి తర్వాత ప్రయత్నించండి."
    );

    await sendNavigation(to);
    return;
  }

  await sendWhatsApp({
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: body },
      action: {
        button: String(buttonText).slice(0, 20),
        sections: safeSections,
      },
    },
  });

  await sendNavigation(to);
}

// ==================================================
// 3. SUPABASE
// ==================================================

async function getOrCreateUser(phone) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("phone_number", phone)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  const { data: created, error: insertError } = await supabase
    .from("users")
    .insert({
      phone_number: phone,
      current_state: "IDLE",
      cart: [],
      temp_selection: {},
    })
    .select("*")
    .single();

  if (insertError) throw insertError;

  return created;
}

async function updateUser(phone, updates) {
  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("phone_number", phone);

  if (error) throw error;
}

async function setState(phone, state, extra = {}) {
  await updateUser(phone, {
    current_state: state,
    ...extra,
  });
}

async function saveOrder(
  phone,
  serviceType,
  details,
  status = "REQUESTED"
) {
  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_phone: phone,
      service_type: serviceType,
      details: JSON.stringify(details),
      status,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Supabase order save error:", error);
    throw error;
  }

  return data;
}

async function getOrderById(orderId) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw error;

  return data;
}

async function updateOrder(orderId, updates) {
  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Order not found");

  return data;
}

// కస్టమర్ నంబర్ ద్వారా లేటెస్ట్ ఆర్డర్ వెతికే ఫంక్షన్
async function getLatestCustomerOrder(phone) {
  const cleanPhone = normalizePhone(phone);
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_phone", cleanPhone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Get latest order error:", error);
    return null;
  }
  return data;
}

// ==================================================
// 4. MAIN MENU & WELCOME IMAGE
// ==================================================

async function showMainMenu(to) {
  await sendLocalImage(
    to,
    serviceImage("welcome.jpg"),
    "నమస్కారం! 🙏 Avento Services‌కు స్వాగతం.\n\nమీకు కావలసిన సేవను ఎంచుకోండి. మేము తదుపరి దశలో మీకు సహాయం చేస్తాము."
  );

  await sendList(
    to,
    "దయచేసి ఒక సేవను ఎంచుకోండి:",
    "సేవలు ఎంచుకోండి",
    [
      {
        title: "మా సేవలు",
        rows: [
          {
            id: "srv_food",
            title: "Food Order",
            description: "హోటల్ ఫుడ్ డెలివరీ",
          },
          {
            id: "srv_meat",
            title: "Fresh Meat Delivery",
            description: "చికెన్, మటన్, చేపలు",
          },
          {
            id: "srv_med",
            title: "Medicine Order",
            description: "మందుల డెలివరీ",
          },
          {
            id: "srv_plumbing",
            title: "Home Repairs",
            description: "ప్లంబింగ్, ఎలక్ట్రికల్",
          },
          {
            id: "srv_shifting",
            title: "Home Shifting / Parcel",
            description: "ఇల్లు మారడం, పార్సెల్ డెలివరీ",
          },
        ],
      },
    ]
  );
}

async function startService(phone, service) {
  await setState(phone, "IDLE", {
    cart: [],
    location: null,
    temp_selection: { service },
  });
}

async function goToMainMenu(phone) {
  await setState(phone, "IDLE", {
    location: null,
    temp_selection: {},
  });

  await showMainMenu(phone);
}

async function goBack(phone, user) {
  const state = user.current_state || "IDLE";
  const temp = getTemp(user);
  const cart = getCart(user);

  switch (state) {
    case "SELECT_HOTEL":
      await goToMainMenu(phone);
      return;

    case "FOOD_CATEGORY":
      await showHotels(phone);
      return;

    case "FOOD_ITEMS":
      await showFoodCategories(phone, temp.hotel_name);
      return;

    case "MEAT_CATEGORY":
      await goToMainMenu(phone);
      return;

    case "MEAT_QUANTITY":
      await showMeatCategories(phone);
      return;

    case "CART":
      if (temp.service === "fresh_meat") {
        await showMeatCategories(phone);
      } else if (temp.service === "food") {
        await showFoodCategories(phone, temp.hotel_name);
      } else {
        await goToMainMenu(phone);
      }
      return;

    case "AWAITING_LOCATION":
      if (temp.service === "medicine") {
        await sendText(
          phone,
          "ప్రిస్క్రిప్షన్ అందింది. లొకేషన్ పంపడానికి తిరిగి వెళ్లండి లేదా Main Menu ఎంచుకోండి."
        );
        await sendNavigation(phone);
      } else if (cart.length) {
        await showCart(phone, cart, temp.hotel_name);
      } else {
        await goToMainMenu(phone);
      }
      return;

    case "REVIEW_ORDER":
      if (cart.length) {
        await showCart(phone, cart, temp.hotel_name);
      } else {
        await goToMainMenu(phone);
      }
      return;

    case "AWAITING_PRESCRIPTION":
    case "AWAITING_SERVICE_DETAILS":
      await goToMainMenu(phone);
      return;

    case "AWAITING_UTR":
      await sendText(
        phone,
        "మీ పేమెంట్ రిఫరెన్స్ ఇంకా పెండింగ్‌లో ఉంది. UTR లేదా పేమెంట్ ఫోటో పంపడం ద్వారా వెరిఫికేషన్ పూర్తి చేయవచ్చు."
      );
      await sendNavigation(phone);
      return;

    default:
      await goToMainMenu(phone);
  }
}

// ==================================================
// 5. HOTEL SELECTION
// ==================================================

async function showHotels(to) {
  await setState(to, "SELECT_HOTEL");

  await sendList(
    to,
    "🍽️ Food Order\n\nదయచేసి మీకు కావాల్సిన హోటల్‌ను ఎంచుకోండి.",
    "హోటల్ ఎంచుకోండి",
    [
      {
        title: "Available Hotels",
        rows: [
          {
            id: "hotel_brindavanam",
            title: "Brindavanam",
            description: "బృందావనం రెస్టారెంట్",
          },
          {
            id: "hotel_king_biryani",
            title: "King Biryani",
            description: "కింగ్ బిర్యానీ",
          },
        ],
      },
    ]
  );
}

// ==================================================
// 6. FOOD MENU
// ==================================================

async function showFoodCategories(to, hotelName) {
  const categories = getFoodCategories();

  await setState(to, "FOOD_CATEGORY");

  await sendList(
    to,
    `🏨 ${hotelName || "Food Order"}\n\n🍽️ మీకు కావాల్సిన ఫుడ్ కేటగిరీ ఎంచుకోండి.`,
    "Food Categories",
    [
      {
        title: "Restaurant Menu",
        rows: categories.slice(0, 10).map(category => ({
          id: `cat_${category.id}`,
          title: category.title || category.name || category.id,
        })),
      },
    ]
  );
}

async function showFoodItems(to, categoryId, page = 0) {
  const category = getFoodCategories().find(
    item => String(item.id) === String(categoryId)
  );

  if (!category) {
    await sendText(to, "ఈ కేటగిరీ దొరకలేదు.");
    await sendNavigation(to);
    return;
  }

  const items = category.items || [];
  const pageSize = 7;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  page = Math.max(0, Math.min(page, totalPages - 1));

  const visibleItems = items.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  const rows = visibleItems.map(item => ({
    id: `item_${item.id}`,
    title: item.name,
    description: formatRupees(item.price),
  }));

  if (page > 0) {
    rows.push({
      id: `foodpage_${categoryId}_${page - 1}`,
      title: "Previous Page",
    });
  }

  if (page < totalPages - 1) {
    rows.push({
      id: `foodpage_${categoryId}_${page + 1}`,
      title: "Next Page",
    });
  }

  await setState(to, "FOOD_ITEMS", {
    temp_selection: {
      ...(getTemp(await getOrCreateUser(to))),
      current_category_id: categoryId,
      current_page: page,
    },
  });

  await sendList(
    to,
    `${category.title || category.name || category.id}\nPage ${page + 1}/${totalPages}\n\nమీకు కావాల్సిన ఐటమ్ ఎంచుకోండి.`,
    "Food Items",
    [{ title: "Available Items", rows }]
  );
}

// ==================================================
// 7. FRESH MEAT
// ==================================================

async function showMeatCategories(to) {
  const categories = getMeatCategories();

  await setState(to, "MEAT_CATEGORY");

  await sendList(
    to,
    "🥩 Fresh Meat Delivery\n\nమీకు కావాల్సిన మీట్ రకం ఎంచుకోండి.",
    "Meat Categories",
    [
      {
        title: "Fresh Meat",
        rows: categories.slice(0, 10).map(category => ({
          id: String(category.id),
          title: category.title || category.name || category.id,
        })),
      },
    ]
  );
}

async function showMeatQuantities(to, meatItem) {
  const quantities = freshMeatMenu.quantities || [];

  await sendList(
    to,
    `🥩 ${meatItem.name}\n\nఎన్ని కిలోలు కావాలి? ధరను మా బృందం నిర్ధారిస్తుంది.`,
    "Select KG",
    [
      {
        title: "Quantity",
        rows: quantities.slice(0, 10).map((quantity, index) => ({
          id: `qty_${index}_${meatItem.id}`,
          title: quantity.title || `${quantity.id}`,
        })),
      },
    ]
  );
}

// ==================================================
// 8. CART & REVIEW
// ==================================================

function renderCart(cart) {
  if (!cart.length) return "మీ కార్ట్ ఖాళీగా ఉంది.";

  const lines = cart.map((item, index) => {
    if (item.price_pending) {
      return (
        `${index + 1}. ${item.name}\n` +
        `   పరిమాణం: ${item.quantity} KG\n` +
        `   ధర: నిర్ధారించాలి`
      );
    }

    const quantity = Number(item.quantity || 1);
    const price = Number(item.price || 0);

    return (
      `${index + 1}. ${item.name}\n` +
      `   Qty: ${quantity}\n` +
      `   ధర: ${formatRupees(price * quantity)}`
    );
  });

  lines.push("\n--------------------");
  lines.push(`ఫుడ్ మొత్తం: ${formatRupees(getCartTotal(cart))}`);

  return lines.join("\n");
}

async function showCart(to, cart, hotelName) {
  const hotelLine = hotelName ? `🏨 హోటల్: ${hotelName}\n\n` : "";

  await setState(to, "CART");

  await sendButtons(
    to,
    `🛒 మీ కార్ట్\n\n${hotelLine}${renderCart(cart)}`,
    [
      { id: "cart_add_more", title: "మరిన్ని ఐటమ్స్" },
      { id: "cart_remove", title: "ఐటమ్ తొలగించు" },
      { id: "cart_checkout", title: "కొనసాగించు" },
    ]
  );

  await sendNavigation(to);
}

async function showRemoveItems(to, cart) {
  if (!cart.length) {
    await sendText(to, "మీ కార్ట్ ఖాళీగా ఉంది.");
    await sendNavigation(to);
    return;
  }

  await sendList(
    to,
    "తొలగించాల్సిన ఐటమ్ ఎంచుకోండి.",
    "Remove Item",
    [
      {
        title: "Cart Items",
        rows: cart.slice(0, 10).map((item, index) => ({
          id: `remove_${index}`,
          title: `${index + 1}. ${item.name}`,
        })),
      },
    ]
  );
}

// ==================================================
// 9. LOCATION & REVIEW
// ==================================================

async function askForLocation(phone, user) {
  await setState(phone, "AWAITING_LOCATION", {
    temp_selection: {
      ...getTemp(user),
      purpose: "CHECKOUT",
    },
  });

  await sendText(
    phone,
    "📍 దయచేసి మీ లొకేషన్‌ను షేర్ చేయండి."
  );

  await sendNavigation(phone);
}

function renderServiceReview(user) {
  const temp = getTemp(user);
  const location = getLocation(user);
  const cart = getCart(user);
  const service = temp.service;
  const lines = ["🧾 మీ ఆర్డర్ సమ్మరీ (Order Summary)", ""];

  if (service === "food") {
    lines.push(`🏨 హోటల్: ${temp.hotel_name || "Food Palace Family Restaurant"}`);
    lines.push("");
    lines.push(renderCart(cart));

    if (location) {
      const distance = calculateDistance(
        RESTAURANT_LAT,
        RESTAURANT_LNG,
        location.latitude,
        location.longitude
      );
      const deliveryFee = calculateDeliveryFee(distance);
      const foodTotal = getCartTotal(cart);
      const grandTotal = foodTotal + deliveryFee;

      lines.push("");
      lines.push(`📏 రెస్టారెంట్ నుండి దూరం: ${distance.toFixed(1)} KM`);
      lines.push(`🚚 డెలివరీ చార్జీలు: ${formatRupees(deliveryFee)}`);
      lines.push("--------------------");
      lines.push(`💰 చెల్లించాల్సిన మొత్తం: ${formatRupees(grandTotal)}`);
    }
  } else if (service === "fresh_meat") {
    lines.push("🥩 Fresh Meat Order");
    lines.push("");
    lines.push(renderCart(cart));

    if (location) {
      const distance = calculateDistance(
        RESTAURANT_LAT,
        RESTAURANT_LNG,
        location.latitude,
        location.longitude
      );
      const deliveryFee = calculateDeliveryFee(distance);
      lines.push("");
      lines.push(`📏 లొకేషన్ నుండి దూరం: ${distance.toFixed(1)} KM`);
      lines.push(`🚚 డెలివరీ చార్జీలు: ${formatRupees(deliveryFee)} (మీట్ ధర నిర్ధారించాలి)`);
    }
  } else if (service === "medicine") {
    lines.push("💊 మెడిసిన్ రిక్వెస్ట్ (ప్రిస్క్రిప్షన్ అందింది)");
  } else if (service === "plumbing_electrical") {
    lines.push("🔧 Home Repairs (ప్లంబింగ్ / ఎలక్ట్రికల్)");
    lines.push(`వివరాలు: ${temp.notes || "వివరాలు అందించబడ్డాయి"}`);
  } else if (service === "shifting") {
    lines.push(`🚚 ${temp.service_name || "Home Shifting / Parcel"}`);
    lines.push(`వివరాలు: ${temp.notes || "వివరాలు అందించబడ్డాయి"}`);
  }

  if (location && service !== "food" && service !== "fresh_meat") {
    const distance = calculateDistance(
      RESTAURANT_LAT,
      RESTAURANT_LNG,
      location.latitude,
      location.longitude
    );
    const deliveryFee = calculateDeliveryFee(distance);

    lines.push("");
    lines.push(`📏 దూరం: ${distance.toFixed(1)} KM`);
    lines.push(`🚚 అంచనా డెలివరీ చార్జీలు: ${formatRupees(deliveryFee)}`);
    lines.push(`📍 Location: ${location.latitude}, ${location.longitude}`);
  } else if (location && service === "fresh_meat") {
    lines.push("");
    lines.push(`📍 Location: ${location.latitude}, ${location.longitude}`);
  }

  lines.push("");
  lines.push("దయచేసి మీ వివరాలను నిర్ధారించండి.");

  return lines.join("\n");
}

async function showReview(phone, user) {
  await setState(phone, "REVIEW_ORDER");

  await sendButtons(
    phone,
    renderServiceReview(user),
    [
      { id: "order_submit", title: "నిర్ధారించు" },
      { id: "order_cancel", title: "రద్దు చేయي" },
    ]
  );

  await sendNavigation(phone);
}

// ==================================================
// 10. PAYMENT
// ==================================================

async function sendPaymentInstructions(phone, order, details) {
  const amount = Number(details.total || 0);

  if (!AVENTO_UPI_ID) {
    await sendText(
      phone,
      `మీ ఆర్డర్ #${order.id} నమోదు అయింది. కానీ UPI ID సెటప్ కాలేదు. మా బృందాన్ని సంప్రదించండి.`
    );
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    await sendText(
      phone,
      `మీ ఆర్డర్ #${order.id} ధర ఇంకా నిర్ధారించబడలేదు. మా బృందం ధర తెలియజేస్తుంది.`
    );
    return;
  }

  const qrPath = serviceImage("payment-qr.png");

  const caption =
    `💳 PhonePe / UPI Payment\n\n` +
    `🧾 ఆర్డర్ నంబర్: #${order.id}\n` +
    `💰 చెల్లించాల్సిన మొత్తం: ${formatRupees(amount)}\n\n` +
    `📱 UPI ID: ${AVENTO_UPI_ID}\n` +
    `👤 పేరు: ${AVENTO_UPI_NAME}\n\n` +
    `QR కోడ్ స్కాన్ చేసి లేదా UPI IDకి చెల్లించండి.\n` +
    `చెల్లింపు చేసిన తర్వాత UTR నంబర్ లేదా పేమెంట్ రసీదు/స్క్రీన్‌షాట్‌ను ఇక్కడ పంపండి.\n\n` +
    `గమనిక: పేమెంట్‌ను వెరిఫై చేసిన తర్వాతే ఆర్డర్ కన్ఫర్మ్ అవుతుంది.`;

  if (fs.existsSync(qrPath)) {
    const sent = await sendLocalImage(phone, qrPath, caption);

    if (!sent) await sendText(phone, caption);
  } else {
    await sendText(phone, caption);
  }
}

async function initiatePaymentFlow(phone, user) {
  const cart = getCart(user);
  const temp = getTemp(user);
  const service = temp.service;

  if (!["food", "fresh_meat"].includes(service)) {
    await createServiceRequest(phone, user);
    return;
  }

  if (!cart.length) {
    await sendText(phone, "మీ కార్ట్ ఖాళీగా ఉంది. ముందుగా ఐటమ్స్ ఎంచుకోండి.");
    await sendNavigation(phone);
    return;
  }

  const hasPendingPrice = cart.some(item => item.price_pending);
  let foodTotal = getCartTotal(cart);
  let deliveryFee = 0;

  const location = getLocation(user);
  if (location) {
    const distance = calculateDistance(RESTAURANT_LAT, RESTAURANT_LNG, location.latitude, location.longitude);
    deliveryFee = calculateDeliveryFee(distance);
  }

  const totalAmount = foodTotal + deliveryFee;

  const details = {
    service,
    items: cart,
    food_total: foodTotal,
    delivery_fee: deliveryFee,
    total: totalAmount,
    location: location,
    notes: temp.notes || null,
    hotel_name: temp.hotel_name || null,
    service_name: temp.service_name || null,
    payment: {
      method: "UPI_MANUAL",
      status: hasPendingPrice ? "PRICE_PENDING" : "PENDING",
      utr_transaction_id: null,
    },
    created_at: new Date().toISOString(),
  };

  try {
    const cleanPhone = normalizePhone(phone);
    const chatLink = `https://wa.me/${cleanPhone}`;

    if (service === "fresh_meat" || hasPendingPrice) {
      details.payment.status = "PRICE_PENDING";

      const order = await saveOrder(
        phone,
        service,
        details,
        "PRICE_PENDING"
      );

      await setState(phone, "IDLE", {
        cart: [],
        temp_selection: {},
      });

      await sendText(
        phone,
        `✅ మీ Fresh Meat ఆర్డర్ రిక్వెస్ట్ నమోదు అయింది.\n\n` +
        `🧾 ఆర్డర్ నంబర్: #${order.id}\n` +
        `🥩 మీట్ ధరను మా బృందం నిర్ధారిస్తుంది.\n` +
        `ధర నిర్ధారించిన తర్వాత చెల్లింపు వివరాలు పంపిస్తాము.\n\n` +
        `ధన్యవాదాలు! 🙏`
      );

      await sendNavigation(phone);

      const loc = details.location ? `https://maps.google.com/?q=${details.location.latitude},${details.location.longitude}` : "లొకేషన్ లేదు";
      const itemsList = cart.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(", ");
      
      await sendOrderEmail(
        `🚀 కొత్త ఫ్రెష్ మీట్ ఆర్డర్ వచ్చింది! (#${order.id})`,
        `<h2>🥩 కొత్త ఫ్రెష్ మీట్ ఆర్డర్</h2>
         <p><b>ఫోన్ నంబర్ / వాట్సాప్:</b> <a href="${chatLink}" target="_blank">${phone} (చాట్ ఓపెన్ చేయండి)</a></p>
         <p><b>ఐటమ్స్:</b> ${itemsList}</p>
         <p><b>డెలివరీ చార్జీలు:</b> ${formatRupees(deliveryFee)}</p>
         <p><b>లొకేషన్:</b> <a href="${loc}" target="_blank">Google Maps లో చూడండి</a></p>`
      );

      return;
    }

    if (totalAmount <= 0) {
      await sendText(
        phone,
        "ఆర్డర్ మొత్తం సరిగ్గా లేదు. దయచేసి కార్ట్‌ను మళ్లీ చెక్ చేయండి."
      );
      return;
    }

    const order = await saveOrder(
      phone,
      service,
      details,
      "PENDING_PAYMENT"
    );

    await setState(phone, "AWAITING_UTR", {
      temp_selection: {
        ...temp,
        pending_order_id: order.id,
      },
    });

    await sendPaymentInstructions(phone, order, details);
    await sendNavigation(phone);

    const loc = details.location ? `https://maps.google.com/?q=${details.location.latitude},${details.location.longitude}` : "లొకేషన్ లేదు";
    const itemsList = cart.map(i => `${i.name} (Qty: ${i.quantity})`).join(", ");

    await sendOrderEmail(
      `🚀 కొత్త ఫుడ్ ఆర్డర్ వచ్చింది! (#${order.id})`,
      `<h2>🍽️ కొత్త ఫుడ్ ఆర్డర్ (${details.hotel_name || 'Food Palace'})</h2>
       <p><b>ఫోన్ నంబర్ / వాట్సాప్:</b> <a href="${chatLink}" target="_blank">${phone} (చాట్ ఓపెన్ చేయండి)</a></p>
       <p><b>ఐటమ్స్:</b> ${itemsList}</p>
       <p><b>ఫుడ్ మొత్తం:</b> ${formatRupees(foodTotal)}</p>
       <p><b>డెలివరీ చార్జీలు:</b> ${formatRupees(deliveryFee)}</p>
       <p><b>మొత్తం చెల్లించాల్సింది:</b> ${formatRupees(totalAmount)}</p>
       <p><b>లొకేషన్:</b> <a href="${loc}" target="_blank">Google Maps లో చూడండి</a></p>`
    );

  } catch (error) {
    console.error("Payment flow error:", error.message);

    await sendText(
      phone,
      "ఆర్డర్ ప్రాసెస్ చేయడంలో లోపం ఏర్పడింది. దయచేసి మళ్లీ ప్రయత్నించండి."
    );
  }
}

// ==================================================
// 11. NON-FOOD SERVICE REQUESTS
// ==================================================

async function createServiceRequest(phone, user) {
  const temp = getTemp(user);

  const location = getLocation(user);
  let deliveryFee = 0;
  if (location) {
    const distance = calculateDistance(RESTAURANT_LAT, RESTAURANT_LNG, location.latitude, location.longitude);
    deliveryFee = calculateDeliveryFee(distance);
  }

  const details = {
    service: temp.service,
    service_name: temp.service_name || null,
    notes: temp.notes || null,
    media_id: temp.media_id || temp.prescription_media_id || null,
    location: location,
    delivery_fee: deliveryFee,
    status: "REQUESTED",
    created_at: new Date().toISOString(),
  };

  try {
    const order = await saveOrder(
      phone,
      temp.service || "other",
      details,
      "REQUESTED"
    );

    await setState(phone, "IDLE", {
      cart: [],
      temp_selection: {},
    });

    await sendText(
      phone,
      `🎉 మీ ఆర్డర్ విజయవంతంగా బుక్ చేయబడింది. ధన్యవాదాలు! 🙏\n\n` +
      `🧾 ఆర్డర్ నంబర్: #${order.id}\n\n` +
      `మా బృందం మీ వివరాలను పరిశీలించి త్వరలోనే మిమ్మల్ని సంప్రదిస్తుంది.`
    );

    await sendNavigation(phone);

    const loc = details.location ? `https://maps.google.com/?q=${details.location.latitude},${details.location.longitude}` : "లొకేషన్ లేదు";
    const cleanPhone = normalizePhone(phone);
    const chatLink = `https://wa.me/${cleanPhone}`;

    await sendOrderEmail(
      `🚀 కొత్త సర్వీస్ రిక్వెస్ట్ వచ్చింది! (#${order.id})`,
      `<h2>🛠️ కొత్త సర్వీస్ రిక్వెస్ట్ (${getServiceName(temp.service)})</h2>
       <p><b>ఫోన్ నంబర్ / వాట్సాప్:</b> <a href="${chatLink}" target="_blank" style="padding: 6px 12px; background-color: #25D366; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">💬 కస్టమర్ వాట్సాప్ చాట్ ఓపెన్ చేయండి (${phone})</a></p>
       <p><b>వివరాలు:</b> ${details.notes || 'వివరాలు లేవు'}</p>
       <p><b>అంచనా డెలివరీ చార్జీలు:</b> ${formatRupees(deliveryFee)}</p>
       <p><b>లొకేషన్:</b> <a href="${loc}" target="_blank">Google Maps లో చూడండి</a></p>`
    );

  } catch (error) {
    console.error("Service request error:", error.message);

    await sendText(
      phone,
      "మీ రిక్వెస్ట్ సేవ్ చేయడంలో లోపం ఏర్పడింది. దయచేసి మళ్లీ ప్రయత్నించండి."
    );
  }
}

// ==================================================
// 12. ADMIN COMMANDS (ONE-CLICK BUTTONS)
// ==================================================

async function handleAdminCommand(phone, text) {
  if (!isAdmin(phone)) return false;

  const trimmed = String(text || "").trim();

  // 1. PRICE COMMAND: price ORDER_ID AMOUNT
  const priceMatch = trimmed.match(
    /^price\s+(\S+)\s+(\d+(?:\.\d{1,2})?)$/i
  );

  if (priceMatch) {
    const orderId = priceMatch[1];
    const amount = Number(priceMatch[2]);

    if (!Number.isFinite(amount) || amount <= 0) {
      await sendText(phone, "ధర సరిగ్గా ఇవ్వండి. ఉదాహరణ: price ORDER_ID 450");
      return true;
    }

    try {
      const order = await getOrderById(orderId);

      if (!order) {
        await sendText(phone, `ఆర్డర్ దొరకలేదు: ${orderId}`);
        return true;
      }

      if (order.status !== "PRICE_PENDING") {
        await sendText(
          phone,
          `ఈ ఆర్డర్ PRICE_PENDING స్థితిలో లేదు. ప్రస్తుత స్థితి: ${order.status}`
        );
        return true;
      }

      const details = parseOrderDetails(order.details);

      details.total = amount;
      details.payment = {
        ...(details.payment || {}),
        method: "UPI_MANUAL",
        status: "PENDING",
        quoted_at: new Date().toISOString(),
        utr_transaction_id: null,
      };

      await updateOrder(orderId, {
        details: JSON.stringify(details),
        status: "PENDING_PAYMENT",
      });

      await setState(order.user_phone, "AWAITING_UTR", {
        temp_selection: {
          service: details.service || order.service_type,
          pending_order_id: order.id,
        },
      });

      await sendPaymentInstructions(order.user_phone, order, details);

      await sendText(
        phone,
        `ధర నమోదు అయింది.\nOrder: #${order.id}\nAmount: ${formatRupees(amount)}`
      );
    } catch (error) {
      console.error("Admin price command error:", error.message);
      await sendText(phone, "ధర అప్‌డేట్ చేయలేకపోయాం. Order ID మరియు DBను చెక్ చేయండి.");
    }

    return true;
  }

  // 2. PAID COMMAND: paid ORDER_ID
  const paidMatch = trimmed.match(/^paid\s+(\S+)$/i);

  if (paidMatch) {
    const orderId = paidMatch[1];

    try {
      const order = await getOrderById(orderId);

      if (!order) {
        await sendText(phone, `ఆర్డర్ దొరకలేదు: ${orderId}`);
        return true;
      }

      if (order.status !== "PAYMENT_REVIEW") {
        await sendText(
          phone,
          `ఈ ఆర్డర్ PAYMENT_REVIEW స్థితిలో లేదు. ప్రస్తుత స్థితి: ${order.status}\n\n` +
          `PhonePeలో పేమెంట్‌ను చెక్ చేసి, UTR/స్క్రీన్‌షాట్ వచ్చిన ఆర్డర్ మాత్రమే కన్ఫర్మ్ చేయండి.`
        );
        return true;
      }

      const details = parseOrderDetails(order.details);

      details.payment = {
        ...(details.payment || {}),
        status: "PAID",
        verified_manually: true,
        verified_at: new Date().toISOString(),
      };

      await updateOrder(orderId, {
        details: JSON.stringify(details),
        status: "PREPARING",
      });

      // కస్టమర్‌కి ఆర్డర్ కన్ఫర్మ్ అయిందని చెప్పి, ట్రాకింగ్ బటన్ ఇవ్వడం
      await sendButtons(
        order.user_phone,
        `🎉 మీ ఆర్డర్ విజయవంతంగా బుక్ చేయబడింది. ధన్యవాదాలు! 🙏\n\n` +
        `✅ మీ ఆర్డర్ కన్ఫర్మ్ అయింది.\n` +
        `🧾 ఆర్డర్ నంబర్: #${order.id}\n` +
        `💰 మొత్తం: ${formatRupees(details.total)}\n\n` +
        `📦 స్టేటస్: హోటల్‌కు ఆర్డర్ పంపబడింది (Preparing).`,
        [
          { id: "track_order", title: "📦 Track Order" },
          { id: "nav_main", title: "🏠 Main Menu" }
        ]
      );

      // అడ్మిన్‌కి టైప్ చేయకుండా నేరుగా స్టేటస్ మార్చుకోవడానికి 3 బటన్లు పంపడం
      await sendButtons(
        phone,
        `✅ ఆర్డర్ #${order.id} కన్ఫర్మ్ అయింది.\n\nకస్టమర్‌కి స్టేటస్ అప్‌డేట్ చేయడానికి కింద బటన్ నొక్కండి:`,
        [
          { id: `st_prep_${order.id}`, title: "👨‍🍳 Preparing" },
          { id: `st_out_${order.id}`, title: "🚀 Out for Delivery" },
          { id: `st_del_${order.id}`, title: "✅ Delivered" }
        ]
      );
    } catch (error) {
      console.error("Admin paid command error:", error.message);
      await sendText(phone, "ఆర్డర్ కన్ఫర్మ్ చేయలేకపోయాం. సూపర్‌బేస్‌లో వివరాలు చెక్ చేయండి.");
    }

    return true;
  }

  // 3. STATUS COMMAND: status ORDER_ID (అడ్మిన్‌కి బటన్లు పంపుతుంది)
  const statusMatch = trimmed.match(/^status\s+(\S+)$/i);

  if (statusMatch) {
    const orderId = statusMatch[1];

    try {
      const order = await getOrderById(orderId);

      if (!order) {
        await sendText(phone, `ఆర్డర్ దొరకలేదు: ${orderId}`);
        return true;
      }

      await sendButtons(
        phone,
        `⚙️ **Order #${orderId} Status Update**\n\nదయచేసి కింది బటన్లలో ఒకదాన్ని ఎంచుకోండి:`,
        [
          { id: `st_prep_${orderId}`, title: "👨‍🍳 Preparing" },
          { id: `st_out_${orderId}`, title: "🚀 Out for Delivery" },
          { id: `st_del_${orderId}`, title: "✅ Delivered" }
        ]
      );
    } catch (error) {
      console.error("Admin status command error:", error.message);
      await sendText(phone, "ఆర్డర్ స్టేటస్ బటన్లు పంపడంలో లోపం ఏర్పడింది.");
    }

    return true;
  }

  if (/^(paid|price|status)\b/i.test(trimmed)) {
    await sendText(
      phone,
      "Admin commands:\n\n" +
      "1️⃣ price ORDER_ID AMOUNT (ఉదా: price 12 450)\n" +
      "2️⃣ paid ORDER_ID (ఉదా: paid 12)\n" +
      "3️⃣ status ORDER_ID (ఉదా: status 12 - బటన్లు వస్తాయి)\n\n" +
      "గమనిక: అడ్మిన్ కేవలం బటన్‌పై క్లిక్ చేయడం ద్వారా కస్టమర్‌కి స్టేటస్ పంపవచ్చు."
    );

    return true;
  }

  return false;
}

// ==================================================
// 13. WEBHOOK VERIFICATION
// ==================================================

app.get(
  ["/webhook", "/whatsapp/webhook", "/whatsapp/webhook/"],
  (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
  }
);

// ==================================================
// 14. INCOMING WHATSAPP MESSAGES
// ==================================================

app.post(
  ["/webhook", "/whatsapp/webhook", "/whatsapp/webhook/"],
  async (req, res) => {
    res.sendStatus(200);

    try {
      const value = req.body?.entry?.[0]?.changes?.[0]?.value;
      const message = value?.messages?.[0];

      if (!message) return;

      const phone = message.from;
      const type = message.type;

      const text =
        type === "text" ? message.text?.body?.trim() || "" : "";

      const command =
        message.interactive?.button_reply?.id ||
        message.interactive?.list_reply?.id ||
        text;

      const normalized = normalize(command);

      const user = await getOrCreateUser(phone);
      const cart = getCart(user);
      const temp = getTemp(user);

      if (type === "text" && await handleAdminCommand(phone, text)) {
        return;
      }

      // అడ్మిన్ బటన్ నొక్కినప్పుడు (st_prep_ID, st_out_ID, st_del_ID)
      if (String(command).startsWith("st_")) {
        if (!isAdmin(phone)) return;

        const parts = String(command).split("_"); // ['st', 'prep', '62']
        const action = parts[1];
        const orderId = parts[2];

        const order = await getOrderById(orderId);
        if (!order) return;

        let newStatusText = "";
        let statusMessageToCustomer = "";

        if (action === "prep") {
          newStatusText = "PREPARING";
          statusMessageToCustomer = `👨‍🍳 అప్‌డేట్: మీ ఆర్డర్‌ను హోటల్ వారు తయారు చేస్తున్నారు (Preparing). త్వరలో డెలివరీకి సిద్దమవుతుంది!`;
        } else if (action === "out") {
          newStatusText = "OUT_FOR_DELIVERY";
          statusMessageToCustomer = `🚀 అప్‌డేట్: మీ ఆర్డర్ డెలివరీ బాయ్ చేతికి ఇవ్వబడింది మరియు మీ లొకేషన్ వైపు బయలుదేరింది (Out for Delivery)!`;
        } else if (action === "del") {
          newStatusText = "DELIVERED";
          statusMessageToCustomer = `✅ అప్‌డేట్: మీ ఆర్డర్ విజయవంతంగా డెలివరీ చేయబడింది! Avento వాడినందుకు ధన్యవాదాలు. 🙏`;
        }

        await updateOrder(orderId, { status: newStatusText });

        // కస్టమర్‌కి వాట్సాప్‌లో మెసేజ్ మరియు ట్రాకింగ్ బటన్
        await sendButtons(
          order.user_phone,
          `📦 **Live Order Tracking** (#${order.id})\n\n${statusMessageToCustomer}`,
          [
            { id: "track_order", title: "📦 Track Order" },
            { id: "nav_main", title: "🏠 Main Menu" }
          ]
        );

        // అడ్మిన్‌కి కన్ఫర్మేషన్ మరియు మళ్లీ తర్వాతి స్టేటస్ మార్చుకోవడానికి బటన్లు
        await sendButtons(
          phone,
          `✅ ఆర్డర్ #${orderId} స్టేటస్ విజయవంతంగా '${newStatusText}' కి మార్చబడింది.\n\nమరో స్టేటస్ మార్చడానికి ఎంచుకోండి:`,
          [
            { id: `st_prep_${orderId}`, title: "👨‍🍳 Preparing" },
            { id: `st_out_${orderId}`, title: "🚀 Out for Delivery" },
            { id: `st_del_${orderId}`, title: "✅ Delivered" }
          ]
        );
        return;
      }

      // కస్టమర్ "Track Order" నొక్కినప్పుడు డేటాబేస్ నుండి స్టేటస్ ఆటోమేటిక్‌గా చూపించడం
      if (command === "track_order" || ["track order", "where is my order", "order status", "ఆర్డర్ ఎక్కడుంది"].includes(normalized)) {
        const latestOrder = await getLatestCustomerOrder(phone);

        if (!latestOrder) {
          await sendText(phone, "మీ పేరు మీద ఎలాంటి యాక్టివ్ ఆర్డర్స్ కనుగొనబడలేదు.");
          await sendNavigation(phone);
          return;
        }

        let statusDesc = "";
        const st = latestOrder.status;

        if (st === "PRICE_PENDING") statusDesc = "🥩 మీట్ ధర నిర్ధారణ కోసం పెండింగ్‌లో ఉంది.";
        else if (st === "PENDING_PAYMENT") statusDesc = "💳 పేమెంట్ పెండింగ్‌లో ఉంది.";
        else if (st === "PAYMENT_REVIEW") statusDesc = "🔍 పేమెంట్ వెరిఫికేషన్ జరుగుతోంది.";
        else if (st === "PREPARING" || st === "CONFIRMED") statusDesc = "👨‍🍳 హోటల్‌లో మీ ఆర్డర్ తయారవుతోంది (Preparing).";
        else if (st === "OUT_FOR_DELIVERY") statusDesc = "🚀 డెలివరీ బాయ్ మీ లొకేషన్ వైపు బయలుదేరాడు (Out for Delivery)!";
        else if (st === "DELIVERED") statusDesc = "✅ ఆర్డర్ విజయవంతంగా డెలివరీ చేయబడింది (Delivered).";
        else statusDesc = `స్థితి: ${st}`;

        await sendButtons(
          phone,
          `📦 **Order Tracking Details**\n\n` +
          `🧾 ఆర్డర్ నంబర్: #${latestOrder.id}\n` +
          `📌 ప్రస్తుత స్టేటస్: ${statusDesc}\n\n` +
          `ఏదైనా సహాయం కావాలంటే Main Menu ఎంచుకోండి.`,
          [
            { id: "track_order", title: "🔄 Refresh Status" },
            { id: "nav_main", title: "🏠 Main Menu" }
          ]
        );
        return;
      }

      if (
        command === "nav_main" ||
        ["hi", "hello", "menu", "start", "హాయ్", "మెనూ", "hi avento services", "hi avento"].includes(normalized)
      ) {
        await goToMainMenu(phone);
        return;
      }

      if (
        command === "nav_back" ||
        ["back", "వెనక్కి", "వెనుకకు"].includes(normalized)
      ) {
        await goBack(phone, user);
        return;
      }

      // PAYMENT PROOF / UTR / SCREENSHOT HANDLING
      if (user.current_state === "AWAITING_UTR") {
        const orderId = temp.pending_order_id;

        if (!orderId) {
          await sendText(
            phone,
            "మీ పెండింగ్ ఆర్డర్ నంబర్ దొరకలేదు. మా బృందాన్ని సంప్రదించండి."
          );
          return;
        }

        const order = await getOrderById(orderId);

        if (!order || normalizePhone(order.user_phone) !== normalizePhone(phone)) {
          await sendText(phone, "ఆర్డర్‌ను కనుగొనలేకపోయాం.");
          return;
        }

        let utrNumber = text;
        let imageMediaId = message.image?.id || null;

        if (type === "image" && imageMediaId) {
          utrNumber = `IMAGE_SCREENSHOT_${imageMediaId}`;
        }

        if (!utrNumber) {
          await sendText(
            phone,
            "దయచేసి మీ PhonePe UTR / UPI Ref No లేదా పేమెంట్ స్క్రీన్‌షాట్ పంపండి."
          );
          return;
        }

        const details = parseOrderDetails(order.details);

        details.payment = {
          ...(details.payment || {}),
          method: "UPI_MANUAL",
          status: "PAYMENT_REVIEW",
          utr_transaction_id: utrNumber,
          screenshot_media_id: imageMediaId,
          submitted_at: new Date().toISOString(),
        };

        await updateOrder(orderId, {
          details: JSON.stringify(details),
          status: "PAYMENT_REVIEW",
        });

        await setState(phone, "IDLE", {
          cart: [],
          temp_selection: {},
        });

        await sendText(
          phone,
          `✅ మీ పేమెంట్ వివరాలు / స్క్రీన్‌షాట్ అందింది.\n\n` +
          `🧾 ఆర్డర్ నంబర్: #${order.id}\n` +
          `మా బృందం PhonePeలో పేమెంట్‌ను వెరిఫై చేసిన తర్వాతే ఆర్డర్ కన్ఫర్మ్ అవుతుంది.\n\n` +
          `ధన్యవాదాలు! 🙏`
        );

        const cleanPhone = normalizePhone(phone);
        const chatLink = `https://wa.me/${cleanPhone}`;

        await sendOrderEmail(
          `💳 కొత్త పేమెంట్ రివ్యూ వచ్చింది! (#${order.id})`,
          `<h2>💳 పేమెంట్ వెరిఫికేషన్ అవసరం</h2>
           <p><b>Order ID:</b> #${order.id}</p>
           <p><b>Customer WhatsApp:</b> <a href="${chatLink}" target="_blank" style="color: #25D366; font-weight: bold;">💬 చాట్ ఓపెన్ చేసి స్క్రీన్‌షాట్ చూడండి (${phone})</a></p>
           <p><b>Amount:</b> ${formatRupees(details.total)}</p>
           <p><b>UTR / Text:</b> ${text || 'స్క్రీన్‌షాట్ పంపారు'}</p>`
        );

        if (AVENTO_ADMIN_PHONE) {
          // అడ్మిన్‌కి పేమెంట్ అలర్ట్‌తో పాటు ఆర్డర్ కన్ఫర్మ్ చేయడానికి బటన్/కమాండ్ సూచన
          await sendText(
            AVENTO_ADMIN_PHONE,
            `💳 Payment verification required\n\n` +
            `Order ID: ${order.id}\n` +
            `Customer: ${phone}\n` +
            `Amount: ${formatRupees(details.total)}\n` +
            `UTR/Status: ${text || 'Screenshot received'}\n\n` +
            `PhonePeలో పేమెంట్ చెక్ చేసిన తర్వాత కన్ఫర్మ్ చేయడానికి టైప్ చేయండి:\n` +
            `paid ${order.id}`
          );
        }

        return;
      }

      if (
        command === "order_cancel" ||
        ["cancel", "రద్దు"].includes(normalized)
      ) {
        await setState(phone, "IDLE", {
          cart: [],
          location: null,
          temp_selection: {},
        });

        await sendText(phone, "మీ ప్రస్తుత రిక్వెస్ట్ రద్దు చేయబడింది.");
        await showMainMenu(phone);
        return;
      }

      if (type === "location" && message.location) {
        if (user.current_state !== "AWAITING_LOCATION") {
          await sendText(
            phone,
            "దయచేసి ముందుగా ఆర్డర్ ప్రక్రియలోకి వెళ్లి, అడిగినప్పుడు లొకేషన్ పంపండి."
          );
          await sendNavigation(phone);
          return;
        }

        const location = {
          latitude: message.location.latitude,
          longitude: message.location.longitude,
        };

        const updatedUser = {
          ...user,
          location,
          current_state: "REVIEW_ORDER",
        };

        await updateUser(phone, {
          location,
          current_state: "REVIEW_ORDER",
        });

        await showReview(phone, updatedUser);
        return;
      }

      if (user.current_state === "AWAITING_LOCATION" && type === "text") {
        await sendText(
          phone,
          "📍 **మీ లొకేషన్ అత్యంత ముఖ్యం!**\n\n" +
          "మా సర్వీస్ టీమ్ మీ వద్దకు త్వరగా చేరుకోవడానికి మరియు డెలివరీ నిర్ధారించడానికి మీ లొకేషన్ ఎంతో అవసరం.\n\n" +
          "దయచేసి తప్పుడు టైపింగ్ కాకుండా WhatsApp లో **Share Location** ద్వారా మీ లొకేషన్‌ను షేర్ చేయాల్సిందిగా కోరుతున్నాము. 🙏"
        );

        await sendNavigation(phone);
        return;
      }

      if (command === "srv_food") {
        await startService(phone, "food");

        await setState(phone, "SELECT_HOTEL", {
          temp_selection: { service: "food" },
        });

        await sendLocalImage(
          phone,
          serviceImage("food.jpg"),
          "🍽️ Food Order\n\nమీరు ఫుడ్ ఆర్డర్ చేయాలనుకుంటే మీ లొకేషన్ షేర్ చేయండి."
        );

        await showHotels(phone);
        return;
      }

      if (
        command === "hotel_brindavanam" ||
        command === "hotel_king_biryani"
      ) {
        const selectedHotel =
          command === "hotel_brindavanam"
            ? { id: "brindavanam", name: "Brindavanam" }
            : { id: "king_biryani", name: "King Biryani" };

        await setState(phone, "FOOD_CATEGORY", {
          cart: [],
          temp_selection: {
            service: "food",
            hotel_id: selectedHotel.id,
            hotel_name: selectedHotel.name,
          },
        });

        await showFoodCategories(phone, selectedHotel.name);
        return;
      }

      if (command === "srv_meat") {
        await startService(phone, "fresh_meat");

        await setState(phone, "MEAT_CATEGORY", {
          temp_selection: { service: "fresh_meat" },
        });

        await sendLocalImage(
          phone,
          serviceImage("fresh-meat.jpg"),
          "🥩 Fresh Meat Delivery\n\nచికెన్, మటన్, చేపలు ఫ్రీ ఫ్రెష్ డెలివరీ."
        );

        await showMeatCategories(phone);
        return;
      }

      if (command === "srv_med") {
        await startService(phone, "medicine");

        await setState(phone, "AWAITING_PRESCRIPTION", {
          temp_selection: { service: "medicine" },
        });

        await sendLocalImage(
          phone,
          serviceImage("medicine.jpg"),
          "💊 Medicines\n\nమందుల డెలివరీ కోసం ప్రిస్క్రిప్షన్ ఫోటోను పంపండి."
        );

        await sendText(
          phone,
          "💊 మెడిసిన్ రిక్వెస్ట్ కోసం మీ ప్రిస్క్రిప్షన్ ఫోటో లేదా డాక్యుమెంట్ పంపండి."
        );

        await sendNavigation(phone);
        return;
      }

      if (command === "srv_plumbing") {
        await startService(phone, "plumbing_electrical");

        await setState(phone, "AWAITING_SERVICE_DETAILS", {
          temp_selection: {
            service: "plumbing_electrical",
            notes: "",
          },
        });

        await sendLocalImage(
          phone,
          serviceImage("plumbing-electrical.jpg"),
          "🔧 Home Repairs\n\nప్లంబింగ్, ఎలక్ట్రికల్ పనుల వివరాలు తెలియజేయండి."
        );

        await sendText(
          phone,
          "🔧 మీకు కావాల్సిన పని లేదా సమస్య వివరాలు టైప్ చేయండి లేదా ఫోటో పంపండి."
        );

        await sendNavigation(phone);
        return;
      }

      if (command === "srv_shifting") {
        await startService(phone, "shifting");

        await sendLocalImage(
          phone,
          serviceImage("shifting-parcel.jpg"),
          "🚚 Home Shifting / Parcel\n\nఇల్లు మారడం, పార్సెల్ డెలివరీ సేవల కోసం ఎంచుకోండి."
        );

        await sendList(
          phone,
          "🚚 ఏ సర్వీస్ కావాలి?",
          "సర్వీస్ ఎంచుకోండి",
          [
            {
              title: "Shifting Services",
              rows: [
                { id: "shift_home", title: "Home Shifting" },
                { id: "shift_parcel", title: "Parcel Delivery" },
              ],
            },
          ]
        );

        return;
      }

      const pageMatch = String(command).match(/^foodpage_(.+)_(\d+)$/);

      if (pageMatch) {
        await showFoodItems(
          phone,
          pageMatch[1],
          Number(pageMatch[2])
        );
        return;
      }

      if (String(command).startsWith("cat_")) {
        await showFoodItems(phone, String(command).slice(4), 0);
        return;
      }

      if (String(command).startsWith("item_")) {
        const item = getFoodItem(String(command).slice(5));

        if (!item) {
          await sendText(phone, "ఈ ఐటమ్ దొరకలేదు.");
          await sendNavigation(phone);
          return;
        }

        const updatedCart = [
          ...cart,
          {
            id: item.id,
            name: item.name,
            price: Number(item.price || 0),
            quantity: 1,
            unit: "item",
            service: "food",
          },
        ];

        await setState(phone, "CART", { cart: updatedCart });
        await showCart(phone, updatedCart, temp.hotel_name);
        return;
      }

      const meatCategory = getMeatCategories().find(
        category => String(category.id) === String(command)
      );

      if (meatCategory) {
        const meatItem = meatCategory.items?.[0];

        if (!meatItem) {
          await sendText(phone, "ఈ మీట్ కేటగిరీలో ప్రస్తుతం ఐటమ్స్ లేవు.");
          await sendNavigation(phone);
          return;
        }

        await setState(phone, "MEAT_QUANTITY", {
          temp_selection: {
            ...temp,
            service: "fresh_meat",
            selected_meat_id: meatItem.id,
          },
        });

        await showMeatQuantities(phone, meatItem);
        return;
      }

      const quantityMatch = String(command).match(
        /^qty_(\d+)_([A-Za-z0-9_-]+)$/
      );

      if (quantityMatch) {
        const quantityIndex = Number(quantityMatch[1]);
        const meatItem = getMeatItem(quantityMatch[2]);
        const quantityOption = (freshMeatMenu.quantities || [])[quantityIndex];

        if (!meatItem || !quantityOption) {
          await sendText(
            phone,
            "మీట్ ఐటమ్ లేదా పరిమాణం సరిగ్గా లేదు. మళ్లీ ఎంచుకోండి."
          );
          await sendNavigation(phone);
          return;
        }

        const rawQuantity =
          quantityOption.value ??
          quantityOption.kg ??
          quantityOption.quantity ??
          quantityOption.id ??
          quantityOption.title;

        const parsedQuantity = Number(
          String(rawQuantity).match(/\d+(?:\.\d+)?/)?.[0]
        );

        if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
          await sendText(
            phone,
            "ఈ పరిమాణాన్ని గుర్తించలేకపోయాం."
          );
          return;
        }

        const titleText = String(quantityOption.title || "").toLowerCase();
        const quantityKg =
          /g\b|grams?/.test(titleText) && !/kg/.test(titleText)
            ? parsedQuantity / 1000
            : parsedQuantity;

        const updatedCart = [
          ...cart,
          {
            id: `${meatItem.id}_${Date.now()}`,
            name: meatItem.name,
            quantity: quantityKg,
            unit: "KG",
            price: 0,
            price_pending: true,
            service: "fresh_meat",
          },
        ];

        await setState(phone, "CART", {
          cart: updatedCart,
          temp_selection: {
            ...temp,
            service: "fresh_meat",
          },
        });

        await showCart(phone, updatedCart);
        return;
      }

      if (command === "cart_add_more") {
        if (temp.service === "fresh_meat") {
          await showMeatCategories(phone);
        } else if (temp.service === "food") {
          await showFoodCategories(phone, temp.hotel_name);
        } else {
          await showMainMenu(phone);
        }

        return;
      }

      if (command === "cart_remove") {
        await showRemoveItems(phone, cart);
        return;
      }

      if (String(command).startsWith("remove_")) {
        const index = Number(String(command).slice(7));

        if (!Number.isInteger(index) || index < 0 || index >= cart.length) {
          await sendText(phone, "తొలగించాల్సిన ఐటమ్ సరిగ్గా లేదు.");
          await sendNavigation(phone);
          return;
        }

        const updatedCart = cart.filter((_, i) => i !== index);

        await setState(phone, "CART", { cart: updatedCart });
        await showCart(phone, updatedCart, temp.hotel_name);
        return;
      }

      if (command === "cart_checkout") {
        if (!cart.length) {
          await sendText(phone, "మీ కార్ట్ ఖాళీగా ఉంది.");
          await sendNavigation(phone);
          return;
        }

        await askForLocation(phone, user);
        return;
      }

      if (command === "shift_home" || command === "shift_parcel") {
        const serviceName =
          command === "shift_home" ? "Home Shifting" : "Parcel Delivery";

        await setState(phone, "AWAITING_SERVICE_DETAILS", {
          temp_selection: {
            service: "shifting",
            service_name: serviceName,
            notes: "",
          },
        });

        await sendText(
          phone,
          `🚚 ${serviceName}\n\n` +
          `దయచేసి పికప్ లొకేషన్, డ్రాప్ లొకేషన్, వస్తువుల వివరాలు పంపండి.`
        );

        await sendNavigation(phone);
        return;
      }

      if (user.current_state === "AWAITING_PRESCRIPTION") {
        const media = message.image || message.document;

        if (!media?.id) {
          await sendText(
            phone,
            "దయచేసి ప్రిస్క్రిప్షన్ ఫోటో లేదా డాక్యుమెంట్ పంపండి."
          );
          await sendNavigation(phone);
          return;
        }

        await setState(phone, "AWAITING_LOCATION", {
          temp_selection: {
            ...temp,
            media_id: media.id,
          },
        });

        await sendText(
          phone,
          "📄 ప్రిస్క్రిప్షన్ అందింది. ఇప్పుడు మా సర్వీస్ టీమ్ మీ వద్దకు చేరుకోవడానికి మీ లొకేషన్‌ను Share Location ద్వారా పంపండి."
        );

        await sendNavigation(phone);
        return;
      }

      if (user.current_state === "AWAITING_SERVICE_DETAILS") {
        let notes = text || "";
        let mediaId = message.image?.id || message.document?.id || null;

        if (!notes && !mediaId) {
          await sendText(
            phone,
            "దయచేసి పని వివరాలు టైప్ చేయండి లేదా ఫోటో పంపండి."
          );
          await sendNavigation(phone);
          return;
        }

        await setState(phone, "AWAITING_LOCATION", {
          temp_selection: {
            ...temp,
            notes: notes || "ఫోటో పంపబడింది",
            media_id: mediaId,
          },
        });

        await sendText(
          phone,
          "✅ వివరాలు అందాయి. ఇప్పుడు మా సర్వీస్ టీమ్ మీ వద్దకు రావడానికి మీ లొకేషన్‌ను Share Location ద్వారా పంపండి."
        );

        await sendNavigation(phone);
        return;
      }

      if (command === "order_submit") {
        if (user.current_state !== "REVIEW_ORDER") {
          await sendText(
            phone,
            "మీ ఆర్డర్ ప్రస్తుతం review స్థితిలో లేదు. Main Menuకి వెళ్లి మళ్లీ ప్రారంభించండి."
          );
          await sendNavigation(phone);
          return;
        }

        await initiatePaymentFlow(phone, user);
        return;
      }

      if (type === "text") {
        await sendText(
          phone,
          "క్షమించండి, మీ ఎంపిక అర్థం కాలేదు.\n\nప్రధాన మెనూకు రావడానికి కింద ఉన్న Main Menu బటన్ నొక్కండి లేదా menu అని పంపండి."
        );

        await sendNavigation(phone);
      }
    } catch (error) {
      console.error(
        "Webhook error:",
        error.response?.data || error.message
      );
    }
  }
);

// ==================================================
// 15. HEALTH CHECK & LANDING PAGE
// ==================================================

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="te">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Avento Services - WhatsApp Bot</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f6f8; text-align: center; padding: 50px 20px; }
            .card { background: white; max-width: 400px; margin: 0 auto; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
            h2 { color: #075e54; margin-bottom: 10px; }
            p { color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 25px; }
            .btn { display: inline-block; background-color: #25d366; color: white; padding: 12px 25px; font-size: 18px; font-weight: bold; text-decoration: none; border-radius: 30px; box-shadow: 0 4px 6px rgba(37, 211, 102, 0.3); }
            .btn:hover { background-color: #1ebe5d; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>🙏 Avento Services</h2>
            <p>నమస్కారం! Avento Services‌కు స్వాగతం. మీకు కావలసిన సేవల కోసం కింద ఉన్న బటన్‌ను క్లిక్ చేసి 'హాయ్' అని పంపండి.</p>
            <a class="btn" href="https://wa.me/919059135163?text=Hi%20Avento%20Services" target="_blank">💬 WhatsApp లో చాట్ చేయండి</a>
        </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Avento WhatsApp Bot running on port ${PORT}`);
});