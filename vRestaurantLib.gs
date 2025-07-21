// RestaurantLib.gs
function installTrigger() {
  const url = "https://example.com";
  const response = UrlFetchApp.fetch(url);  // Will prompt re-auth
  Logger.log(response.getContentText());
}

// === RestaurantLib.gs ===


function sendMagicLink(email) {
  if (!email) throw new Error("Email is required");

  const token = Utilities.getUuid(); // Unique login token
  const expiresAt = Date.now() + 15 * 60 * 1000; // Valid for 15 minutes

  const tokenData = JSON.stringify({ email, token, expiresAt });

  // Store in ScriptProperties so it's accessible to all users
  PropertiesService.getScriptProperties().setProperty(token, tokenData);

  const link = ScriptApp.getService().getUrl() + `?token=${token}`;
  const subject = "Your Magic Login Link";
  const body = `Hello,\n\nClick the link below to log in:\n\n${link}\n\nThis link will expire in 15 minutes.\n\n- YourDigiAssist`;

  MailApp.sendEmail(email, subject, body);
  return true;
}

function validateMagicToken(token) {
  if (!token) return null;

  const stored = PropertiesService.getScriptProperties().getProperty(token);
  if (!stored) return null;

  const { email, expiresAt } = JSON.parse(stored);
  //logError('expiresAt--'+expiresAt);
  //logError('stored--'+stored);
  const now = Date.now();

  if (now > expiresAt) {
    PropertiesService.getScriptProperties().deleteProperty(token);
    return null;
  }

  // Token is valid — delete after use
  PropertiesService.getScriptProperties().deleteProperty(token);
    //logError('email--'+email);
  return email;
}


function getUserByEmail(email) {
  email = 'ddds.com';
    const spreadsheetId = "1CzMKZy9_imdydq6M-Dx7bZK__QxV056rJ9EY6sybYZI";
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName("Customer");
  const data = sheet.getDataRange().getValues();
  
  const headers = data[0];
  const emailIndex = headers.indexOf("Email");
  const user = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][emailIndex] === email) {
      // Convert row to object
      headers.forEach((key, idx) => {
        user[key] = data[i][idx];
      });
      return user;
    }
  }

  if(user == null){
    user['Email'] = email;
    sheet.appendRow([
          email
        ]);  

  }
  
  return user; // Not found
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

function sendOtpSms(phoneNumber, otp) {
  const accountSid = "AC73d60721da4f3da4544f14b407495268";
  const authToken = "a77ddbfaa5c7dd6053206a26a8f5219e";
  const messagingServiceSid = "MGe7d76aea799d0c159b62349fb3edb32d"; // e.g., +12025550123
  const toNumber = "+91"+phoneNumber;// + phoneNumber; // Assumes Indian phone number
  otp = '2323';
 /* const payload = {
    To: toNumber,
    From: messagingServiceSid,
    Body: `Your OTP to login is: ${otp}`
  };*/
  const testNumber = "+917668933865";
  const payload = {
  To:  testNumber,
  Body: `Your OTP to login is: ${otp}`,
  MessagingServiceSid: messagingServiceSid
};

  const options = {
    method: "post",
    headers: {
      Authorization: "Basic " + Utilities.base64Encode(accountSid + ":" + authToken)
    },
    muteHttpExceptions: true,
    payload: payload
  };

  const url = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";
  const response = UrlFetchApp.fetch(url, options);
  Logger.log(response.getContentText());
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Orders");
sheet.appendRow([
      'hiiii--'+response.getContentText()
    ]);
  console.log('response--',response.getContentText());
  return response;
}

function generateAndSendOtp(phoneNumber) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const now = Date.now();

  const otpData = JSON.stringify({
    otp,
    createdAt: now
  });

  PropertiesService.getUserProperties().setProperty(`OTP_${phoneNumber}`, otpData);

  sendOtpSms(phoneNumber, otp);
  return true;
}

function verifyOtp(phoneNumber, enteredOtp) {
  const stored = PropertiesService.getUserProperties().getProperty(`OTP_${phoneNumber}`);
  if (!stored) return false;

  const { otp, createdAt } = JSON.parse(stored);
  const expired = (Date.now() - createdAt) > 5 * 60 * 1000;

  if (!expired && otp === enteredOtp) {
    PropertiesService.getUserProperties().deleteProperty(`OTP_${phoneNumber}`);
    return true;
  }

  return false;
}



function authorizeUrlFetch() {
  const url = "https://example.com";
  const response = UrlFetchApp.fetch(url); // 🔥 This triggers the permission prompt
  Logger.log(response.getContentText());
}

function logError(data){
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("logs");
  sheet.appendRow([
      data
    ]);

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

function renderMenuPage(config, menu, user) {
  const template = HtmlService.createTemplateFromFile("menuPage");

  // Pass config and menu to template
  template.config = config;
  template.menu = menu;
  if(user && user != null){
      template.user = user;
  }

  return template.evaluate()
    .setTitle(config.restaurantName || "Restaurant Menu")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // Optional: allows embedding in iframes
}




