from flask import jsonify

def update_kategori(supabase_client, request):
    """Mengupdate kategori transaksi berdasarkan ID yang ada di body"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'Request body harus berisi JSON. Pastikan header Content-Type adalah application/json.'}), 400

        id = data.get('id_kategori')
        nama_kategori = data.get('nama_kategori')
        jenis_kategori = data.get('jenis_kategori')

        # Validasi input
        if not id:
            return jsonify({'success': False, 'message': 'Field id harus diisi'}), 400
        if not all([nama_kategori, jenis_kategori]):
            return jsonify({'success': False, 'message': 'Field nama_kategori dan jenis_kategori harus diisi'}), 400

        allowed_jenis = ['Pengeluaran', 'Penerimaan']
        if jenis_kategori not in allowed_jenis:
            return jsonify({'success': False, 'message': f'jenis_kategori tidak valid. Gunakan salah satu dari: {allowed_jenis}'}), 400

        # Cek duplikat
        existing = supabase_client.table('kategori_transaksi').select('id_kategori').eq('nama_kategori', nama_kategori).eq('jenis_kategori', jenis_kategori).neq('id_kategori', id).execute()
        if existing.data:
            return jsonify({'success': False, 'message': f'Kategori "{nama_kategori}" dengan jenis "{jenis_kategori}" sudah ada.'}), 409

        # Update data
        response = supabase_client.table('kategori_transaksi').update({
            'nama_kategori': nama_kategori
        }).eq('id_kategori', id).execute()

        if response.data:
            return jsonify({
                'success': True,
                'message': 'Kategori transaksi berhasil diupdate',
                'data': response.data[0]
            }), 200
        else:
            # Cek apakah kategori dengan ID tersebut ada
            check_exists = supabase_client.table('kategori_transaksi').select('id_kategori').eq('id_kategori', id).execute()
            if not check_exists.data:
                return jsonify({'success': False, 'message': f'Kategori dengan ID {id} tidak ditemukan.'}), 404
            
            error_message = "Gagal mengupdate kategori."
            if hasattr(response, 'error') and response.error:
                error_message += f" Detail: {response.error.message}"
            return jsonify({'success': False, 'message': error_message}), 500

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
