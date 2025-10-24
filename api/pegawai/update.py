from flask import jsonify
import bcrypt

def update_pegawai(supabase_client, request):
    """Update pegawai data based on id_pegawai"""
    try:
        data = request.get_json()

        # Pengecekan awal, memastikan data JSON ada
        if not data:
            return jsonify({'success': False, 'message': 'Request body harus berisi JSON. Pastikan header Content-Type adalah application/json.'}), 400

        id_pegawai = data.get('id_pegawai')
        nama_lengkap = data.get('nama_lengkap')
        email = data.get('email')
        password = data.get('password')
        user_role = data.get('role')

        # Validasi input - id_pegawai wajib ada
        if not id_pegawai:
            return jsonify({'success': False, 'message': 'id_pegawai harus diisi'}), 400

        # Cek apakah pegawai ada
        existing_pegawai = supabase_client.table('pegawai').select('*').eq('id_pegawai', id_pegawai).execute()
        if not existing_pegawai.data:
            return jsonify({'success': False, 'message': f'Pegawai dengan id {id_pegawai} tidak ditemukan'}), 404

        # Siapkan data update
        update_data = {}
        
        if nama_lengkap:
            update_data['nama_lengkap'] = nama_lengkap
            
        if email:
            # Cek apakah email sudah ada (kecuali untuk pegawai ini sendiri)
            existing_email = supabase_client.table('pegawai').select('id_pegawai').eq('email', email).neq('id_pegawai', id_pegawai).execute()
            if existing_email.data:
                return jsonify({'success': False, 'message': f'Email {email} sudah digunakan oleh pegawai lain'}), 409
            update_data['email'] = email
            
        if password:
            # Hash password baru
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            update_data['password'] = hashed_password
            
        if user_role:
            if user_role not in ['bendahara', 'petugas_ziswaf']:
                return jsonify({'success': False, 'message': 'User role tidak valid'}), 400
            update_data['role'] = user_role

        # Validasi bahwa ada data yang akan diupdate
        if not update_data:
            return jsonify({'success': False, 'message': 'Tidak ada data yang akan diupdate. Berikan setidaknya satu field: nama_lengkap, email, password, atau role'}), 400

        # Update data
        response = supabase_client.table('pegawai').update(update_data).eq('id_pegawai', id_pegawai).execute()

        if response.data:
            # Jangan kembalikan password hash di response
            updated_user = response.data[0]
            if 'password' in updated_user:
                del updated_user['password']
            return jsonify({
                'success': True,
                'message': 'Data pegawai berhasil diperbarui',
                'data': updated_user
            }), 200
        else:
            # Cek jika ada error dari Supabase
            error_message = "Gagal memperbarui data pegawai."
            if hasattr(response, 'error') and response.error:
                error_message += f" Detail: {response.error.message}"
            return jsonify({'success': False, 'message': error_message}), 500

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
