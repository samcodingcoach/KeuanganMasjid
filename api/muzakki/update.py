from flask import jsonify
from datetime import datetime


def update_muzakki(supabase_client, request):
    """Update existing muzakki data"""
    try:
        data = request.get_json()

        # Initial check to ensure JSON data is present
        if not data:
            return jsonify({'success': False, 'message': 'Request body must contain JSON. Make sure header Content-Type is application/json.'}), 400

        # Extract the ID from the request data (required)
        muzakki_id = data.get('id_muzakki')
        if not muzakki_id:
            return jsonify({'success': False, 'message': 'id_muzakki is required'}), 400

        # Extract fields from request (only update provided fields)
        nama_lengkap = data.get('nama_lengkap')
        alamat = data.get('alamat')
        no_telepon = data.get('no_telepon')
        no_ktp = data.get('no_ktp')
        gps = data.get('gps')
        fakir = data.get('fakir')
        tanggal_lahir = data.get('tanggal_lahir')
        aktif = data.get('aktif')
        keterangan = data.get('keterangan')
        kategori = data.get('kategori')

        # Validation for boolean fields if provided
        if fakir is not None and not isinstance(fakir, bool):
            return jsonify({'success': False, 'message': 'fakir field must be boolean (true/false)'}), 400
        
        if aktif is not None and not isinstance(aktif, bool):
            return jsonify({'success': False, 'message': 'aktif field must be boolean (true/false)'}), 400

        # Validate tanggal_lahir format if provided
        if tanggal_lahir:
            try:
                # Try to parse the date to ensure it's in correct format
                parsed_date = datetime.strptime(tanggal_lahir, '%Y-%m-%d')
            except ValueError:
                return jsonify({'success': False, 'message': 'tanggal_lahir must be in YYYY-MM-DD format'}), 400

        # Prepare the update data
        update_data = {}
        if nama_lengkap is not None:
            update_data['nama_lengkap'] = nama_lengkap
        if alamat is not None:
            update_data['alamat'] = alamat
        if no_telepon is not None:
            update_data['no_telepon'] = no_telepon
        if no_ktp is not None:
            # Check if new KTP number already exists for other records
            existing_ktp = supabase_client.table('muzakki').select('id_muzakki').eq('no_ktp', no_ktp).neq('id_muzakki', muzakki_id).execute()
            if existing_ktp.data:
                return jsonify({'success': False, 'message': f'KTP number {no_ktp} is already registered by another muzakki'}), 409
            update_data['no_ktp'] = no_ktp
        if gps is not None:
            update_data['gps'] = gps
        if fakir is not None:
            update_data['fakir'] = fakir
        if tanggal_lahir is not None:
            update_data['tanggal_lahir'] = tanggal_lahir
        if aktif is not None:
            update_data['aktif'] = aktif
        if keterangan is not None:
            update_data['keterangan'] = keterangan
        if kategori is not None:
            update_data['kategori'] = kategori

        # Update data
        response = supabase_client.table('muzakki').update(update_data).eq('id_muzakki', muzakki_id).execute()

        if response.data:
            updated_muzakki = response.data[0]
            return jsonify({
                'success': True,
                'message': 'Muzakki data successfully updated',
                'data': updated_muzakki
            })
        else:
            return jsonify({
                'success': False,
                'message': 'No muzakki found with the provided ID or no changes made'
            }), 404

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500