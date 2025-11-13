from flask import jsonify, request
import random
from datetime import datetime
import os
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()

def request_reset(supabase, request):
    """Request password reset - generate code, save to DB, and send email"""
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'success': False, 'message': 'Email tidak ditemukan'}), 400
        
        # Check if email exists in pegawai table
        result = supabase.table('pegawai').select('*').eq('email', email).execute()
        if not result.data:
            return jsonify({'success': False, 'message': 'Email tidak ditemukan'}), 400
        
        # Generate 6-digit random number
        verification_code = str(random.randint(100000, 999999))
        
        # Insert the reset request into resetpassword table
        reset_data = {
            'email': email,
            'kode_verifikasi': verification_code,
            'status': False,
            'created_at': str(datetime.now())
        }
        
        # Insert into resetpassword table
        insert_result = supabase.table('resetpassword').insert(reset_data).execute()
        
        if not insert_result.data:
            return jsonify({'success': False, 'message': 'Gagal menyimpan permintaan reset'}), 500
        
        # Send email with verification code
        smtp_server = os.getenv('SMTP_SERVER')
        smtp_port = int(os.getenv('SMTP_PORT', 587))
        sender_email = os.getenv('SMTP_EMAIL')
        sender_password = os.getenv('SMTP_PASSWORD')
        
        if not all([smtp_server, sender_email, sender_password]):
            return jsonify({'success': False, 'message': 'Email configuration error'}), 500
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = email
        msg['Subject'] = "Kode Verifikasi Reset Password"
        
        body = f"""
        Kode verifikasi Anda untuk reset password adalah: {verification_code}
        
        Kode ini berlaku selama 10 menit.
        
        Jika Anda tidak meminta reset password, harap abaikan email ini.
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Connect to server and send email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        
        text = msg.as_string()
        server.sendmail(sender_email, email, text)
        server.quit()
        
        return jsonify({'success': True, 'message': 'Kode verifikasi telah dikirim ke email Anda'})
    
    except Exception as e:
        print(f"Error requesting reset: {e}")
        return jsonify({'success': False, 'message': 'Gagal mengirim kode verifikasi'}), 500

def verify_code(supabase, request):
    """Verify the reset code against database"""
    try:
        data = request.get_json()
        email = data.get('email')
        code = data.get('code')
        
        if not all([email, code]):
            return jsonify({'success': False, 'message': 'Email dan kode verifikasi diperlukan'}), 400
        
        # Search for the code in resetpassword table where status is False
        result = supabase.table('resetpassword').select('*').eq('email', email).eq('kode_verifikasi', code).eq('status', False).execute()
        
        if not result.data:
            return jsonify({'success': False, 'message': 'Kode verifikasi salah atau sudah kedaluwarsa.'}), 400
        
        # Update the status to True (used)
        reset_id = result.data[0]['id_reset']
        update_result = supabase.table('resetpassword').update({'status': True}).eq('id_reset', reset_id).execute()
        
        if update_result.data:
            return jsonify({'success': True, 'message': 'Kode verifikasi benar'})
        else:
            return jsonify({'success': False, 'message': 'Gagal memverifikasi kode'}), 500
    
    except Exception as e:
        print(f"Error verifying code: {e}")
        return jsonify({'success': False, 'message': 'Terjadi kesalahan saat memverifikasi kode'}), 500

def reset_password(supabase, request):
    """Reset password after successful code verification"""
    try:
        import hashlib
        
        data = request.get_json()
        email = data.get('email')
        new_password = data.get('new_password')
        
        if not all([email, new_password]):
            return jsonify({'success': False, 'message': 'Email dan password baru diperlukan'}), 400
        
        # Hash the password (in a real app, use proper password hashing)
        hashed_password = hashlib.sha256(new_password.encode()).hexdigest()
        
        # Update password in database
        from datetime import datetime
        result = supabase.table('pegawai').update({
            'password': hashed_password,
            'updated_at': str(datetime.now())
        }).eq('email', email).execute()
        
        if result.data:
            return jsonify({'success': True, 'message': 'Password berhasil direset'})
        else:
            return jsonify({'success': False, 'message': 'Gagal mereset password'}), 500
    
    except Exception as e:
        print(f"Error resetting password: {e}")
        return jsonify({'success': False, 'message': 'Terjadi kesalahan saat mereset password'}), 500