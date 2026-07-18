from django.core.mail import send_mail
from django.conf import settings


FRONTEND_URL = getattr(settings, 'FRONTEND_URL', 'https://appshiftpilot.com')


def send_verification_email(user, token):
    link = f"{FRONTEND_URL}/verify-email?token={token}"
    send_mail(
        subject="ShiftPilot — E-posta adresinizi doğrulayın",
        message=f"""Merhaba {user.name},

ShiftPilot hesabınızı oluşturduğunuz için teşekkürler.

Hesabınızı etkinleştirmek için aşağıdaki bağlantıya tıklayın (24 saat geçerlidir):

{link}

Bu e-postayı siz talep etmediyseniz dikkate almayın.

ShiftPilot Ekibi
""",
        html_message=f"""
<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:32px">
  <h2 style="color:#0e2549">E-posta Doğrulaması</h2>
  <p>Merhaba <strong>{user.name}</strong>,</p>
  <p>ShiftPilot hesabınızı oluşturduğunuz için teşekkürler. Hesabınızı etkinleştirmek için aşağıdaki butona tıklayın.</p>
  <a href="{link}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
    E-postamı Doğrula
  </a>
  <p style="color:#888;font-size:13px">Bu bağlantı 24 saat geçerlidir. Bu e-postayı siz talep etmediyseniz dikkate almayın.</p>
</div>
""",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def send_password_reset_email(user, token):
    link = f"{FRONTEND_URL}/reset-password?token={token}"
    send_mail(
        subject="ShiftPilot — Şifre Sıfırlama",
        message=f"""Merhaba {user.name},

Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın (1 saat geçerlidir):

{link}

Bu talebi siz yapmadıysanız bu e-postayı dikkate almayın.

ShiftPilot Ekibi
""",
        html_message=f"""
<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:32px">
  <h2 style="color:#0e2549">Şifre Sıfırlama</h2>
  <p>Merhaba <strong>{user.name}</strong>,</p>
  <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın.</p>
  <a href="{link}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
    Şifremi Sıfırla
  </a>
  <p style="color:#888;font-size:13px">Bu bağlantı 1 saat geçerlidir. Bu talebi siz yapmadıysanız dikkate almayın.</p>
</div>
""",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
