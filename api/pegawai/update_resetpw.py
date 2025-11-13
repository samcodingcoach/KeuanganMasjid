from flask import jsonify, request
import os
from dotenv import load_dotenv
import bcrypt

def update_newpassword(supabase, request):
    """Update password using email as identifier"""
    try:
        data = request.get_json()
        email = data.get('email')
        new_password = data.get('new_password')

        if not all([email, new_password]):
            return jsonify({'success': False, 'message': 'Email dan password baru diperlukan'}), 400

        # Hash the new password using bcrypt (same as in update_pribadi.py)
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Find the user by email
        user_result = supabase.table('pegawai').select('*').eq('email', email).execute()

        if not user_result.data:
            return jsonify({'success': False, 'message': 'Akun dengan email tersebut tidak ditemukan'}), 400

        # Update the user's password
        update_result = supabase.table('pegawai').update({
            'password': password_hash
        }).eq('email', email).execute()

        if update_result.data:
            return jsonify({'success': True, 'message': 'Password berhasil diperbarui'})
        else:
            return jsonify({'success': False, 'message': 'Gagal memperbarui password'}), 500

    except Exception as e:
        print(f"Error updating password: {e}")
        return jsonify({'success': False, 'message': 'Terjadi kesalahan saat memperbarui password'}), 500