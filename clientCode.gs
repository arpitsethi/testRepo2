

function doGet(e) { 
  const token = e.parameter.token;
  const spreadsheetId = "1CzMKZy9_imdydq6M-Dx7bZK__QxV056rJ9EY6sybYZI";
const config = RestaurantLib.getConfig(spreadsheetId);
      const { menu } = RestaurantLib.getMenuData(spreadsheetId);
      const html = RestaurantLib.renderMenuPage(config, menu, null);
  if (token) {
    const email = 'test--'+RestaurantLib.validateMagicToken(token);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("logs");
  sheet.appendRow([
      email
    ]);
    if (email && email != null) {
      // Inject user email into HTML
      const user = RestaurantLib.getUserByEmail(email);
      RestaurantLib.renderMenuPage(config, menu, user);

    } else {
      return HtmlService.createHtmlOutput("Invalid or expired login link.");
    }
  }

  // If no token, show login screen or fallback
  return RestaurantLib.renderMenuPage(config, menu, null);
}

function sendMagicLink(email) {
  return RestaurantLib.sendMagicLink(email);
}


function saveOrder(order) {
  return RestaurantLib.saveOrder(order); // Assuming RestaurantLib is your library identifier
}


function generateAndSendOtp(phoneNumber) {
  const aa = RestaurantLib.generateAndSendOtp("7668933865");
  console.log('responseBaba'+aa);
//alert('hi');
  return true;
  //return RestaurantLib.generateAndSendOtp(phoneNumber);
}


function verifyOtp(email, enteredOtp) {
  if (!email || !enteredOtp) return false;

  const stored = PropertiesService.getUserProperties().getProperty(`OTP_${email}`);
  if (!stored) return false;

  const { otp, createdAt } = JSON.parse(stored);
  const now = Date.now();
  const expired = (now - createdAt) > 5 * 60 * 1000; // 5 minutes

  if (!expired && otp === enteredOtp) {
    PropertiesService.getUserProperties().deleteProperty(`OTP_${email}`);
    return true;
  }

  return false;
}

function getLoggedInUserEmail() {
  return Session.getActiveUser().getEmail() || "";
}

