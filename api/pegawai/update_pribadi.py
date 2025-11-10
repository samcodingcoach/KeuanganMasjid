from flask import jsonify
import bcrypt

def update_pribadi(supabase_client, request):
    """Update personal pegawai data (nama_lengkap, email, password) based on id_pegawai"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'success': False, 'message': 'Request body harus berisi JSON.'}), 400

        id_pegawai = data.get('id_pegawai')
        nama_lengkap = data.get('nama_lengkap')
        email = data.get('email')
        password = data.get('password') # Password is optional

        if not id_pegawai or not nama_lengkap or not email:
            return jsonify({'success': False, 'message': 'id_pegawai, nama_lengkap, dan email harus diisi'}), 400

        # Check if pegawai exists
        existing_pegawai = supabase_client.table('pegawai').select('id_pegawai').eq('id_pegawai', id_pegawai).execute()
        if not existing_pegawai.data:
            return jsonify({'success': False, 'message': f'Pegawai dengan id {id_pegawai} tidak ditemukan'}), 404

        # Prepare update data
        update_data = {
            'nama_lengkap': nama_lengkap,
            'email': email
        }

        # Check if email is already used by another employee
        existing_email = supabase_client.table('pegawai').select('id_pegawai').eq('email', email).neq('id_pegawai', id_pegawai).execute()
        if existing_email.data:
            return jsonify({'success': False, 'message': f'Email {email} sudah digunakan oleh pegawai lain'}), 409

        # If password is provided, hash it and add to update_data
        if password and password.strip():
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            update_data['password'] = hashed_password

        # Execute the update
        response = supabase_client.table('pegawai').update(update_data).eq('id_pegawai', id_pegawai).execute()

        if response.data:
            updated_user = response.data[0]
            if 'password' in updated_user:
                del updated_user['password']
            return jsonify({
                'success': True,
                'message': 'Data pribadi berhasil diperbarui',
                'data': updated_user
            }), 200
        else:
            error_message = "Gagal memperbarui data pribadi."
            if hasattr(response, 'error') and response.error:
                error_message += f" Detail: {response.error.message}"
            return jsonify({'success': False, 'message': error_message}), 500

    except Exception as e:
        print(f"Error in update_pribadi: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
