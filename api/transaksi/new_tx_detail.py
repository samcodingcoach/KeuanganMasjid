'''API for Creating New Transaction Detail'''
from flask import jsonify, request
from datetime import datetime

def create_transaksi_detail(supabase_client, req):
    '''Create a new transaction detail record'''
    try:
        # Get JSON data from request
        data = req.get_json()

        if not data:
            return jsonify({
                'success': False,
                'message': 'Data tidak boleh kosong'
            }), 400

        # Extract fields (excluding auto-generated ones: id_detail, created_at)
        deskripsi = data.get('deskripsi')
        id_kategori = data.get('id_kategori')
        jumlah = data.get('jumlah', 0)  # Default to 0 if not provided
        nominal = data.get('nominal')
        isAsset = data.get('isAsset', False)  # Default to False if not provided
        subtotal = data.get('subtotal')
        id_transaksi = data.get('id_transaksi')
        url_bukti = data.get('url_bukti')

        # Validate required field
        if not id_transaksi:
            return jsonify({
                'success': False,
                'message': 'id_transaksi diperlukan'
            }), 400

        # Check if the transaction exists
        existing_transaksi = supabase_client.table('transaksi').select('*').eq('id_transaksi', id_transaksi).execute()

        if not existing_transaksi.data:
            return jsonify({
                'success': False,
                'message': f'Transaksi dengan id_transaksi {id_transaksi} tidak ditemukan'
            }), 404

        # Validate jumlah is numeric
        if jumlah is not None:
            try:
                jumlah = float(jumlah)
            except (ValueError, TypeError):
                return jsonify({
                    'success': False,
                    'message': 'jumlah harus berupa angka'
                }), 400

        # Validate nominal is numeric
        if nominal is not None:
            try:
                nominal = float(nominal)
            except (ValueError, TypeError):
                return jsonify({
                    'success': False,
                    'message': 'nominal harus berupa angka'
                }), 400

        # Validate subtotal is numeric
        if subtotal is not None:
            try:
                subtotal = float(subtotal)
            except (ValueError, TypeError):
                return jsonify({
                    'success': False,
                    'message': 'subtotal harus berupa angka'
                }), 400

        # Validate isAsset is boolean
        if isAsset is not None and not isinstance(isAsset, bool):
            return jsonify({
                'success': False,
                'message': 'isAsset harus berupa boolean'
            }), 400

        # Calculate subtotal if not provided
        if subtotal is None and jumlah is not None and nominal is not None:
            subtotal = jumlah * nominal

        # Create the transaction detail object
        new_detail = {
            'deskripsi': deskripsi,
            'id_kategori': id_kategori,
            'jumlah': jumlah,
            'nominal': nominal,
            'isAsset': isAsset,
            'subtotal': subtotal,
            'id_transaksi': id_transaksi
        }

        # Only include optional fields if they are provided
        if url_bukti is not None:
            new_detail['url_bukti'] = url_bukti

        # Insert into the database
        response = supabase_client.table('transaksi_detail').insert(new_detail).execute()

        return jsonify({
            'success': True,
            'message': 'Detail transaksi berhasil dibuat',
            'data': response.data[0] if response.data else None
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
