from flask import jsonify
import bcrypt
import time
from datetime import datetime, timedelta

def cek_login_pegawai(supabase_client, request):
    """Check employee login credentials"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'success': False, 'message': 'Request body harus berisi JSON.'}), 400

        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'success': False, 'message': 'Email dan password harus diisi.'}), 400

        # Check if there's a block for this IP or email
        # First, let's use in-memory approach, but for production we'd need Redis or database
        # For now, using browser storage based on the client-side implementation

        # Ambil data pegawai berdasarkan email
        user_response = supabase_client.table('pegawai').select('id_pegawai, email, password, role, nama_lengkap').eq('email', email).execute()

        if not user_response.data:
            return jsonify({'success': False, 'message': 'Email tidak ditemukan.'}), 404

        user_data = user_response.data[0]
        hashed_password_from_db = user_data.get('password').encode('utf-8')

        # Cek password
        if bcrypt.checkpw(password.encode('utf-8'), hashed_password_from_db):
            # Jangan kembalikan password di response
            del user_data['password']
            return jsonify({
                'success': True,
                'message': 'Login berhasil.',
                'data': user_data
            }), 200
        else:
            return jsonify({'success': False, 'message': 'Password salah.'}), 401

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
