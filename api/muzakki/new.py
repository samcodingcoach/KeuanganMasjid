from flask import jsonify
from datetime import datetime


def create_muzakki(supabase_client, request):
    """Create a new muzakki"""
    try:
        data = request.get_json()

        # Initial check to ensure JSON data is present
        if not data:
            return jsonify({'success': False, 'message': 'Request body must contain JSON. Make sure header Content-Type is application/json.'}), 400

        # Extract fields from request
        nama_lengkap = data.get('nama_lengkap')
        alamat = data.get('alamat')
        no_telepon = data.get('no_telepon')
        no_ktp = data.get('no_ktp')
        gps = data.get('gps')  # This could be a string representation of coordinates
        fakir = data.get('fakir', False)  # Boolean, default to False
        tanggal_lahir = data.get('tanggal_lahir')  # Expected format: YYYY-MM-DD
        aktif = data.get('aktif', True)  # Boolean, default to True
        keterangan = data.get('keterangan')
        kategori = data.get('kategori')

        # Validation - required fields
        if not all([nama_lengkap, alamat, no_telepon, no_ktp, kategori]):
            return jsonify({
                'success': False, 
                'message': 'Required fields must be filled: nama_lengkap, alamat, no_telepon, no_ktp, kategori'
            }), 400

        # Validate boolean fields
        if not isinstance(fakir, bool):
            return jsonify({'success': False, 'message': 'fakir field must be boolean (true/false)'}), 400
        
        if not isinstance(aktif, bool):
            return jsonify({'success': False, 'message': 'aktif field must be boolean (true/false)'}), 400

        # Validate tanggal_lahir format if provided
        if tanggal_lahir:
            try:
                # Try to parse the date to ensure it's in correct format
                parsed_date = datetime.strptime(tanggal_lahir, '%Y-%m-%d')
            except ValueError:
                return jsonify({'success': False, 'message': 'tanggal_lahir must be in YYYY-MM-DD format'}), 400

        # Check if KTP number already exists
        existing_ktp = supabase_client.table('muzakki').select('id_muzakki').eq('no_ktp', no_ktp).execute()
        if existing_ktp.data:
            return jsonify({'success': False, 'message': f'KTP number {no_ktp} is already registered'}), 409

        # Prepare the insert data
        insert_data = {
            'nama_lengkap': nama_lengkap,
            'alamat': alamat,
            'no_telepon': no_telepon,
            'no_ktp': no_ktp,
            'gps': gps,
            'fakir': fakir,
            'tanggal_lahir': tanggal_lahir,
            'aktif': aktif,
            'keterangan': keterangan,
            'kategori': kategori
        }

        # Remove None values to avoid inserting nulls where not needed
        insert_data = {k: v for k, v in insert_data.items() if v is not None}

        # Insert data
        response = supabase_client.table('muzakki').insert(insert_data).execute()

        if response.data:
            created_muzakki = response.data[0]
            return jsonify({
                'success': True,
                'message': 'Muzakki data successfully created',
                'data': created_muzakki
            }), 201
        else:
            # Check if there's an error from Supabase
            error_message = "Failed to create muzakki data."
            if hasattr(response, 'error') and response.error:
                error_message += f" Detail: {response.error.message}"
            return jsonify({'success': False, 'message': error_message}), 500

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500