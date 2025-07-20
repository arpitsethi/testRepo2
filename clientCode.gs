function doGet() {
  console.log('baba1');
  const spreadsheetId = "1CzMKZy9_imdydq6M-Dx7bZK__QxV056rJ9EY6sybYZI";
  const config = RestaurantLib.getConfig(spreadsheetId);
  const { menu } = RestaurantLib.getMenuData(spreadsheetId); // get `menu` object only
  return RestaurantLib.renderMenuPage(config, menu);
}

function saveOrder(order) {
  return RestaurantLib.saveOrder(order); // Assuming RestaurantLib is your library identifier
}


function sendOtpToEmail(email) {
  if (!email) throw new Error("Email is required");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const now = Date.now();

  const otpData = JSON.stringify({
    otp: otp,
    createdAt: now
  });

  PropertiesService.getUserProperties().setProperty(`OTP_${email}`, otpData);

  const subject = "Your Login OTP for Baba Bites";
  const body = `Hello,\n\nYour OTP is: ${otp}\nIt is valid for 5 minutes.\n\n- Baba Bites`;

  MailApp.sendEmail(email, subject, body);
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

