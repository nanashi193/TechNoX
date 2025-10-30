package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.entity.Bills.Bill;
import com.g5.techdevices.techstore.entity.Bills.BillDetail;
import com.g5.techdevices.techstore.entity.tokens.EmailType;
import lombok.AllArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@AllArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;
    private final Environment env;

    public void sendEmail(String to, EmailType type, String token) {
        String subject;
        String body;
        System.out.println("Send email to: " + to + " with token: " + token);
        switch (type) {
            case VERIFY_ACCOUNT -> {
                subject = "Verify your account";
                body = "Hi! Please click the link to verify your account:\n" +
                        "http://localhost:4200/verify-email?token=" + token;
            }
            case RESET_PASSWORD -> {
                subject = "Reset Password";
                body = "Hi! Click below to reset your password:\n" +
                        "http://localhost:4200/reset-password?token=" + token;
            }
            default -> throw new IllegalArgumentException("Unknown email type");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        message.setFrom(env.getProperty("support.email", "noreply@example.com"));
        mailSender.send(message);
    }
    public void sendOrderConfirmationEmail(Bill bill) {
        String subject = String.format("TechNoX - Xác nhận đơn hàng #%d", bill.getId());
        String body = buildOrderConfirmationEmailBody(bill);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(bill.getEmail()); // Lấy email từ Bill
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
