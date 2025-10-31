from flask import jsonify

def create_kategori(supabase_client, request):
    """Membuat kategori transaksi baru"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'Request body harus berisi JSON. Pastikan header Content-Type adalah application/json.'}), 400

        nama_kategori = data.get('nama_kategori')
        jenis_kategori = data.get('jenis_kategori')

        # Validasi input
        if not all([nama_kategori, jenis_kategori]):
            return jsonify({'success': False, 'message': 'Field nama_kategori dan jenis_kategori harus diisi'}), 400

        allowed_jenis = ['Pengeluaran', 'Penerimaan']
        if jenis_kategori not in allowed_jenis:
            return jsonify({'success': False, 'message': f'jenis_kategori tidak valid. Gunakan salah satu dari: {allowed_jenis}'}), 400

        # Cek duplikat
        existing = supabase_client.table('kategori_transaksi').select('id_kategori').eq('nama_kategori', nama_kategori).eq('jenis_kategori', jenis_kategori).execute()
        if existing.data:
            return jsonify({'success': False, 'message': f'Kategori "{nama_kategori}" dengan jenis "{jenis_kategori}" sudah ada.'}), 409

        # Insert data
        response = supabase_client.table('kategori_transaksi').insert({
            'nama_kategori': nama_kategori,
            'jenis_kategori': jenis_kategori
        }).execute()

        if response.data:
            return jsonify({
                'success': True,
                'message': 'Kategori transaksi berhasil dibuat',
                'data': response.data[0]
            }), 201
        else:
            error_message = "Gagal membuat kategori."
            if hasattr(response, 'error') and response.error:
                error_message += f" Detail: {response.error.message}"
            return jsonify({'success': False, 'message': error_message}), 500

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
