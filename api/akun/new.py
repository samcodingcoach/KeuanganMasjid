from flask import jsonify

def create_akun_kas_bank(supabase_client, request):
    """Membuat akun kas bank baru"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'Request body harus berisi JSON. Pastikan header Content-Type adalah application/json.'}), 400

        nama_akun = data.get('nama_akun')
        jenis_akun = data.get('jenis_akun')
        nomor_rekening = data.get('nomor_rekening')
        nama_bank = data.get('nama_bank')
        saldo_awal = data.get('saldo_awal', 0.00)
        saldo_akhir = data.get('saldo_akhir', 0.00)
        deskripsi = data.get('deskripsi')
        no_referensi = data.get('no_referensi')

        # Validasi input wajib
        if not all([nama_akun, jenis_akun]):
            return jsonify({'success': False, 'message': 'Field nama_akun dan jenis_akun harus diisi'}), 400

        # Validasi jenis_akun
        allowed_jenis = ['kas_fisik', 'rekening_bank']
        if jenis_akun not in allowed_jenis:
            return jsonify({'success': False, 'message': f'jenis_akun tidak valid. Gunakan salah satu dari: {allowed_jenis}'}), 400

        # Cek duplikat nomor_rekening jika diisi
        if nomor_rekening:
            existing_rekening = supabase_client.table('akun_kas_bank').select('id_akun').eq('nomor_rekening', nomor_rekening).execute()
            if existing_rekening.data:
                return jsonify({'success': False, 'message': f'Nomor rekening "{nomor_rekening}" sudah digunakan.'}), 409

        # Cek duplikat no_referensi jika diisi
        if no_referensi:
            existing_referensi = supabase_client.table('akun_kas_bank').select('id_akun').eq('no_referensi', no_referensi).execute()
            if existing_referensi.data:
                return jsonify({'success': False, 'message': f'No referensi "{no_referensi}" sudah digunakan.'}), 409

        # Insert data
        insert_data = {
            'nama_akun': nama_akun,
            'jenis_akun': jenis_akun,
            'saldo_awal': saldo_awal,
            'saldo_akhir': saldo_akhir
        }
        
        # Tambahkan field opsional jika ada
        if nomor_rekening:
            insert_data['nomor_rekening'] = nomor_rekening
        if nama_bank:
            insert_data['nama_bank'] = nama_bank
        if deskripsi:
            insert_data['deskripsi'] = deskripsi
        if no_referensi:
            insert_data['no_referensi'] = no_referensi

        response = supabase_client.table('akun_kas_bank').insert(insert_data).execute()

        if response.data:
            return jsonify({
                'success': True,
                'message': 'Akun kas bank berhasil dibuat',
                'data': response.data[0]
            }), 201
        else:
            error_message = "Gagal membuat akun kas bank."
            if hasattr(response, 'error') and response.error:
                error_message += f" Detail: {response.error.message}"
            return jsonify({'success': False, 'message': error_message}), 500

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
