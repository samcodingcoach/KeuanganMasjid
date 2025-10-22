from flask import jsonify

def update_akun_kas_bank(supabase_client, request):
    """Mengupdate akun kas bank berdasarkan id_akun"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'Request body harus berisi JSON. Pastikan header Content-Type adalah application/json.'}), 400

        id_akun = data.get('id_akun')

        if not id_akun:
            return jsonify({'success': False, 'message': 'Field id_akun harus diisi'}), 400

        # Cek apakah akun dengan id_akun tersebut ada
        existing_akun = supabase_client.table('akun_kas_bank').select('id_akun').eq('id_akun', id_akun).execute()
        if not existing_akun.data:
            return jsonify({'success': False, 'message': f'Akun dengan id_akun "{id_akun}" tidak ditemukan.'}), 404

        # Ambil data yang akan diupdate
        nama_akun = data.get('nama_akun')
        jenis_akun = data.get('jenis_akun')
        nomor_rekening = data.get('nomor_rekening')
        nama_bank = data.get('nama_bank')
        saldo_awal = data.get('saldo_awal')
        saldo_akhir = data.get('saldo_akhir')
        deskripsi = data.get('deskripsi')
        no_referensi = data.get('no_referensi')

        update_data = {}

        if nama_akun:
            update_data['nama_akun'] = nama_akun
        if jenis_akun:
            # Validasi jenis_akun
            allowed_jenis = ['kas_fisik', 'rekening_bank']
            if jenis_akun not in allowed_jenis:
                return jsonify({'success': False, 'message': f'jenis_akun tidak valid. Gunakan salah satu dari: {allowed_jenis}'}), 400
            update_data['jenis_akun'] = jenis_akun
        if nomor_rekening:
            # Cek duplikat nomor_rekening jika diisi dan berbeda dari yang sekarang
            existing_rekening = supabase_client.table('akun_kas_bank').select('id_akun').eq('nomor_rekening', nomor_rekening).neq('id_akun', id_akun).execute()
            if existing_rekening.data:
                return jsonify({'success': False, 'message': f'Nomor rekening "{nomor_rekening}" sudah digunakan oleh akun lain.'}), 409
            update_data['nomor_rekening'] = nomor_rekening
        if nama_bank:
            update_data['nama_bank'] = nama_bank
        if saldo_awal is not None:
            update_data['saldo_awal'] = saldo_awal
        if saldo_akhir is not None:
            update_data['saldo_akhir'] = saldo_akhir
        if deskripsi:
            update_data['deskripsi'] = deskripsi
        if no_referensi:
            # Cek duplikat no_referensi jika diisi dan berbeda dari yang sekarang
            existing_referensi = supabase_client.table('akun_kas_bank').select('id_akun').eq('no_referensi', no_referensi).neq('id_akun', id_akun).execute()
            if existing_referensi.data:
                return jsonify({'success': False, 'message': f'No referensi "{no_referensi}" sudah digunakan oleh akun lain.'}), 409
            update_data['no_referensi'] = no_referensi
        
        if not update_data:
            return jsonify({'success': False, 'message': 'Tidak ada data yang diupdate.'}), 400

        response = supabase_client.table('akun_kas_bank').update(update_data).eq('id_akun', id_akun).execute()

        if response.data:
            return jsonify({
                'success': True,
                'message': 'Akun kas bank berhasil diupdate',
                'data': response.data[0]
            }), 200
        else:
            error_message = "Gagal mengupdate akun kas bank."
            if hasattr(response, 'error') and response.error:
                error_message += f" Detail: {response.error.message}"
            return jsonify({'success': False, 'message': error_message}), 500

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
