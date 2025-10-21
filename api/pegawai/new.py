from flask import jsonify
import bcrypt

def create_pegawai(supabase_client, request):
    """Create a new profile"""
    try:
        data = request.get_json()

        # Pengecekan awal, memastikan data JSON ada
        if not data:
            return jsonify({'success': False, 'message': 'Request body harus berisi JSON. Pastikan header Content-Type adalah application/json.'}), 400

        nama_lengkap = data.get('nama_lengkap')
        email = data.get('email')
        password = data.get('password')
        user_role = data.get('role')

        # Validasi input
        if not all([nama_lengkap, email, password, user_role]):
            return jsonify({'success': False, 'message': 'Semua field harus diisi: nama_lengkap, email, password, user_role'}), 400

        if user_role not in ['bendahara', 'petugas_ziswaf']:
            return jsonify({'success': False, 'message': 'User role tidak valid'}), 400

        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Cek apakah email sudah ada
        existing_user = supabase_client.table('pegawai').select('id_pegawai').eq('email', email).execute()
        if existing_user.data:
            return jsonify({'success': False, 'message': f'Email {email} sudah terdaftar'}), 409

        # Insert data
        response = supabase_client.table('pegawai').insert({
            'nama_lengkap': nama_lengkap,
            'email': email,
            'password': hashed_password,
            'role': user_role
        }).execute()

        if response.data:
            # Jangan kembalikan password hash di response
            created_user = response.data[0]
            if 'password' in created_user:
                del created_user['password']
            return jsonify({
                'success': True,
                'message': 'Profil berhasil dibuat',
                'data': created_user
            }), 201
        else:
            # Cek jika ada error dari Supabase
            error_message = "Gagal membuat profil."
            if hasattr(response, 'error') and response.error:
                error_message += f" Detail: {response.error.message}"
            return jsonify({'success': False, 'message': error_message}), 500

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
