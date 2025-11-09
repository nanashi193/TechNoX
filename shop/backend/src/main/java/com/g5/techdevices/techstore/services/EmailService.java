package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.entity.Bills.Bill;
import com.g5.techdevices.techstore.entity.Bills.BillDetail;
import com.g5.techdevices.techstore.entity.tokens.EmailType;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
public class EmailService {
    private final JavaMailSender mailSender;
    private final Environment env;
    private final String frontendUrl;

    public EmailService(JavaMailSender mailSender,
                        Environment env,
                        @Value("${app.frontend.url}") String frontendUrl) {
        this.mailSender = mailSender;
        this.env = env;
        this.frontendUrl = frontendUrl;
    }

    public void sendEmail(String to, String userName, EmailType type, String token) throws MessagingException {
        String subject;
        String title;
        String mainText;
        String buttonText;
        String url;
        switch (type) {
            case VERIFY_ACCOUNT -> {
                subject = "Xác nhận tài khoản TechNox của bạn";
                title = "Xác nhận Email";
                mainText = "Cảm ơn bạn đã đăng ký. Vui lòng nhấp vào nút bên dưới để xác nhận địa chỉ email của bạn:";
                buttonText = "Xác nhận tài khoản";
                url = frontendUrl + "/verify-email?token=" + token;
            }
            case RESET_PASSWORD -> {
                subject = "Yêu cầu đặt lại mật khẩu";
                title = "Đặt Lại Mật Khẩu";
                mainText = "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấp vào nút bên dưới để tiếp tục:";
                buttonText = "Đặt Lại Mật Khẩu";
                url = frontendUrl + "/reset-password?token=" + token;
            }
            default -> throw new IllegalArgumentException("Unknown email type");
        }
        String htmlBody = buildHtmlEmail(userName, title, mainText, url, buttonText);
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setFrom(env.getProperty("support.email", "noreply@techstore.com"));
        helper.setText(htmlBody, true);
        mailSender.send(message);
    }

    /**
     * Helper (Hàm hỗ trợ) để xây dựng template HTML cho email.
     * (Đây là nơi bạn chỉnh sửa giao diện email)
     */
    private String buildHtmlEmail(String userName, String title, String mainText, String buttonUrl, String buttonText) {
        String storeName = "TechNox";

        return String.format("""
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>%s</title>
                <style>
                    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
                    .container { width: 90%%; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                    .header { padding: 20px; text-align: center; background-color: #0f1116; color: #ffffff; border-top-left-radius: 8px; border-top-right-radius: 8px; }
                    .header h1 { margin: 0; font-size: 24px; }
                    .content { padding: 30px; }
                    .content p { font-size: 16px; line-height: 1.6; color: #333333; }
                    .content p.greeting { font-weight: bold; }
                    .button-container { text-align: center; margin: 30px 0; }
                    .button {
                        background-color: #3b82f6; /* Màu xanh (accent) */
                        color: #ffffff;
                        padding: 12px 25px;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                        font-size: 16px;
                        display: inline-block;
                    }
                    .footer { padding: 20px; text-align: center; font-size: 12px; color: #888888; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>%s</h1> <!-- Tiêu đề (ví dụ: "Xác nhận Email") -->
                    </div>
                    <div class="content">
                        <p class="greeting">Xin chào %s,</p> <!-- Tên người dùng -->
                        <p>%s</p> <!-- Nội dung chính -->
                        <div class="button-container">
                            <a href="%s" class="button">%s</a> <!-- Link và chữ trên nút -->
                        </div>
                        <p>Nếu bạn gặp sự cố khi nhấp vào nút, hãy sao chép và dán liên kết sau vào trình duyệt của bạn:</p>
                        <p style="font-size: 12px; color: #555555; word-break: break-all;">%s</p> <!-- Link dự phòng -->
                        <p style="margin-top: 30px;">Trân trọng,<br>Đội ngũ %s</p>
                    </div>
                    <div class="footer">
                        <p>&copy; %d %s. Đã đăng ký bản quyền.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
                title,
                title,
                userName,
                mainText,
                buttonUrl,
                buttonText,
                buttonUrl,
                storeName,
                java.time.Year.now().getValue(),
                storeName
        );
    }
    public void sendOrderConfirmationEmail(Bill bill) {
        String subject = String.format("TechNoX - Xác nhận đơn hàng #%d", bill.getId());
        String body = buildOrderConfirmationEmailBody(bill);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(bill.getEmail());
            message.setSubject(subject);
            message.setText(body);
            message.setFrom(env.getProperty("spring.mail.username", "noreply@technox.com"));
            mailSender.send(message);
            System.out.println("Order confirmation email sent successfully to " + bill.getEmail());
        } catch (MailException e) {
            System.err.println("Error sending order confirmation email for Bill ID " + bill.getId() + ": " + e.getMessage());
        }
    }

    private String buildOrderConfirmationEmailBody(Bill bill) {
        StringBuilder body = new StringBuilder();
        body.append(String.format("Chào %s,\n\n", bill.getFullName()));
        body.append(String.format("Cảm ơn bạn đã đặt hàng tại TechNoX! Đơn hàng #%d của bạn đã được xác nhận.\n\n", bill.getId()));
        body.append("Thông tin đơn hàng:\n");
        body.append("--------------------\n");
        for (BillDetail detail : bill.getDetails()) {
            body.append(String.format("- %s (%s / %s) x %d: %.0f đ\n",
                    detail.getProduct().getName(),
                    detail.getColor(),
                    detail.getModel(),
                    detail.getQuantity(),
                    detail.getUnitPrice().multiply(BigDecimal.valueOf(detail.getQuantity()))));
        }
        body.append("--------------------\n");
        body.append(String.format("Tổng cộng: %.0f đ\n\n", bill.getTotal()));
        body.append("Thông tin giao hàng:\n");
        body.append(String.format("- Người nhận: %s\n", bill.getFullName()));
        body.append(String.format("- Số điện thoại: %s\n", bill.getPhone()));
        body.append(String.format("- Địa chỉ: %s\n", bill.getShippingAddress()));
        body.append(String.format("- Thanh toán: %s\n\n", bill.getPaymentMethod()));
        body.append("Chúng tôi sẽ thông báo cho bạn khi đơn hàng được vận chuyển.\n\n");
        body.append("Trân trọng,\nĐội ngũ TechNoX");

        return body.toString();
    }
}
