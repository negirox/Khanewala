
import { appConfig } from "@/lib/config";

// This function generates the raw HTML string for the welcome email.
// In a larger app, you might use a library like `react-email` for more complex templates.
export function renderWelcomeEmail(customerName: string): string {
    const restaurantName = appConfig.title;
    const primaryColor = "#D946EF"; // Example color from a theme (plum)
    const backgroundColor = "#f9f9f9";
    const textColor = "#333333";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; background-color: ${backgroundColor}; font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; }
        .header { background-color: ${primaryColor}; color: #ffffff; text-align: center; padding: 20px 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px 20px; color: ${textColor}; line-height: 1.6; }
        .content p { margin: 0 0 15px; }
        .content a { color: ${primaryColor}; text-decoration: none; }
        .button { display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold; }
        .footer { text-align: center; font-size: 12px; color: #777777; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to ${restaurantName}!</h1>
        </div>
        <div class="content">
            <h2>Hi ${customerName},</h2>
            <p>We're thrilled to have you join the ${restaurantName} family. Get ready to embark on a delicious journey with our authentic cuisine.</p>
            <p>As a member, you'll be the first to know about our special offers, new menu items, and exclusive events. You can also start earning loyalty points with your very first order!</p>
            <p style="text-align: center; margin-top: 30px;">
                <a href="#" class="button">Explore Our Menu</a>
            </p>
            <p>If you have any questions, feel free to contact us.</p>
            <p>Bon Appétit,<br>The ${restaurantName} Team</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${restaurantName}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
}
