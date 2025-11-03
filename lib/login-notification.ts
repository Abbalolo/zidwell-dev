import { notificationService } from "./emailNotification";

export async function sendLoginNotificationWithDeviceInfo(
  userProfile: any
): Promise<void> {
  try {
    // Get client IP address
    const getClientIP = async (): Promise<string> => {
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        return data.ip;
      } catch (error) {
        console.error("Failed to get client IP:", error);
        return "Unknown";
      }
    };

    // Get browser and OS info
    const getBrowserInfo = () => {
      const userAgent = navigator.userAgent;
      let browser = "Unknown Browser";
      let os = "Unknown OS";

      // Detect browser
      if (userAgent.includes("Chrome")) browser = "Chrome";
      else if (userAgent.includes("Firefox")) browser = "Firefox";
      else if (userAgent.includes("Safari")) browser = "Safari";
      else if (userAgent.includes("Edge")) browser = "Edge";

      // Detect OS
      if (userAgent.includes("Windows")) os = "Windows";
      else if (userAgent.includes("Mac")) os = "Mac OS";
      else if (userAgent.includes("Linux")) os = "Linux";
      else if (userAgent.includes("Android")) os = "Android";
      else if (userAgent.includes("iOS")) os = "iOS";

      return { browser, os };
    };

    // Get location from IP
    const getLocationFromIP = async (ip: string): Promise<string> => {
      if (ip === "Unknown") return "Location unknown";
      try {
        const response = await fetch(`https://ipapi.co/${ip}/country_name/`);
        const country = await response.text();
        return country || "Location unknown";
      } catch (error) {
        return "Location unknown";
      }
    };

    const clientIP = await getClientIP();
    const { browser, os } = getBrowserInfo();
    const location = await getLocationFromIP(clientIP);

    // Send login notification
    await notificationService.sendLoginNotification(
      {
        email: userProfile.email,
        full_name: userProfile.firstName || userProfile.lastName || "User",
        account_number: userProfile.account_number,
      },
      {
        browser,
        os,
        ip_address: clientIP,
        location,
      }
    );
    console.log("Login notification sent successfully");
  } catch (error) {
    console.error("Failed to send login notification:", error);
    // Don't throw error - notifications shouldn't block login
  }
}
