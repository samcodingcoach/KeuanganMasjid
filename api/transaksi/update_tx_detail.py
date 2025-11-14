'''API for Updating Transaction Detail'''
from flask import jsonify, request
from datetime import datetime

def update_transaksi_detail(supabase_client, req):
    '''Update a transaction detail record'''
    try:
        # Get JSON data from request
        data = req.get_json()

        if not data:
            return jsonify({
                'success': False,
                'message': 'Data tidak boleh kosong'
            }), 400

        # Extract fields
        id_detail = data.get('id_detail')
        deskripsi = data.get('deskripsi')
        id_kategori = data.get('id_kategori')
        jumlah = data.get('jumlah')
        nominal = data.get('nominal')
        isAsset = data.get('isAsset')
        subtotal = data.get('subtotal')
        url_bukti = data.get('url_bukti')

        # Validate required field
        if not id_detail:
            return jsonify({
                'success': False,
                'message': 'id_detail diperlukan'
            }), 400

        # Validate jumlah is numeric if provided
        if jumlah is not None:
            try:
                jumlah = float(jumlah)
            except (ValueError, TypeError):
                return jsonify({
                    'success': False,
                    'message': 'jumlah harus berupa angka'
                }), 400

        # Validate nominal is numeric if provided
        if nominal is not None:
            try:
                nominal = float(nominal)
            except (ValueError, TypeError):
                return jsonify({
                    'success': False,
                    'message': 'nominal harus berupa angka'
                }), 400

        # Validate subtotal is numeric if provided
        if subtotal is not None:
            try:
                subtotal = float(subtotal)
            except (ValueError, TypeError):
                return jsonify({
                    'success': False,
                    'message': 'subtotal harus berupa angka'
                }), 400

        # Validate isAsset is boolean if provided
        if isAsset is not None and not isinstance(isAsset, bool):
            return jsonify({
                'success': False,
                'message': 'isAsset harus berupa boolean'
            }), 400

        # Calculate subtotal if not provided but jumlah and nominal are provided
        if subtotal is None and jumlah is not None and nominal is not None:
            subtotal = jumlah * nominal

        # Create the transaction detail update object
        update_data = {}

        if deskripsi is not None:
            update_data['deskripsi'] = deskripsi
        if id_kategori is not None:
            update_data['id_kategori'] = id_kategori
        if jumlah is not None:
            update_data['jumlah'] = jumlah
        if nominal is not None:
            update_data['nominal'] = nominal
        if isAsset is not None:
            update_data['isAsset'] = isAsset
        if subtotal is not None:
            update_data['subtotal'] = subtotal
        if url_bukti is not None:
            update_data['url_bukti'] = url_bukti

        # Check if the transaction detail exists
        existing_detail = supabase_client.table('transaksi_detail').select('*').eq('id_detail', id_detail).execute()

        if not existing_detail.data:
            return jsonify({
                'success': False,
                'message': f'Detail transaksi dengan id_detail {id_detail} tidak ditemukan'
            }), 404

        # Update the transaction detail in the database
        response = supabase_client.table('transaksi_detail').update(update_data).eq('id_detail', id_detail).execute()

        return jsonify({
            'success': True,
            'message': 'Detail transaksi berhasil diperbarui',
            'data': response.data[0] if response.data else None
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500