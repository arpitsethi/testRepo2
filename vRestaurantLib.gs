// RestaurantLib.gs
function installTrigger() {
  const url = "https://example.com";
  const response = UrlFetchApp.fetch(url);  // Will prompt re-auth
  Logger.log(response.getContentText());
}

function getConfig(spreadsheetId) {
  const configSheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName("Config");
  const data = configSheet.getDataRange().getValues();
  const config = {};
  data.forEach(([key, value]) => config[key] = value);
  return config;
}

function getMenuData(spreadsheetId) {
  const ss = SpreadsheetApp.openById(spreadsheetId);

  // 1. Read Config sheet
  const configSheet = ss.getSheetByName("Config");
  const configData = configSheet ? configSheet.getDataRange().getValues() : [];
  const config = {};
  configData.forEach(([key, value]) => config[key] = value);

  // Set fallback defaults
  config.menuSheet = config.menuSheet || "Menu";
  config.restaurantName = config.restaurantName || "Restaurant Menu";
  config.logoUrl = config.logoUrl || "";
  config.themePrimary = config.themePrimary || "#ff7f50";
  config.themeAccent = config.themeAccent || "#ffb347";
  config.bgColor = config.bgColor || "#f9f9f9";
  config.textColor = config.textColor || "#333";

  // 2. Read Menu sheet
  const menuSheet = ss.getSheetByName(config.menuSheet);
  if (!menuSheet) throw new Error(`Menu sheet "${config.menuSheet}" not found.`);

  const data = menuSheet.getDataRange().getValues();
  const menu = {};

  // Expecting columns: Category | Item | Price | Available | Emoji
  for (let i = 1; i < data.length; i++) {
    const [category, item, price, available, emoji] = data[i];

    if (!category || !item || !price || String(available).toLowerCase() !== "yes") continue;

    if (!menu[category]) {
      menu[category] = {
        emoji: emoji || "",
        items: [],
      };
    }

    menu[category].items.push({
      name: item,
      price: price,
    });
  }

  return { config, menu };
}

function authorizeUrlFetch() {
  const url = "https://example.com";
  const response = UrlFetchApp.fetch(url); // 🔥 This triggers the permission prompt
  Logger.log(response.getContentText());
}

function saveOrder(order) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Orders");
  if (!sheet) throw new Error("❌ 'Orders' sheet not found.");

  const time = new Date();
  let orderTotal = 0;

  order.cart.forEach(item => {
    const amount = item.qty * item.price;
    orderTotal += amount;
    sheet.appendRow([
      time,
      item.name,
      item.qty,
      item.price,
      amount,
      order.txnId
    ]);
  });

  // ✅ Send push notification via Notify.run
  try {
    const channelUrl = "https://notify.run/tusGuMs8izMTkGHKtt72"; // replace with your real URL
    const message = `🛒 New order received!\nTotal: ₹${orderTotal.toFixed(2)}\nTxn ID: ${order.txnId}`;
sheet.appendRow([
      message
    ]);
    const options = {
      method: "post",
      payload: message
    };

    UrlFetchApp.fetch(channelUrl, options);
        console.log('nofify done');
  } catch (e) {
    console.log('error'+e.message);
    Logger.log("Notify.run error: " + e.message);
    sheet.appendRow([
      e.message
    ]);
  }
}





function renderMenuPage(config, menu) {
  const template = HtmlService.createTemplateFromFile("menuPage");

  // Pass config and menu to template
  template.config = config;
  template.menu = menu;

  return template.evaluate()
    .setTitle(config.restaurantName || "Restaurant Menu")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // Optional: allows embedding in iframes
}




