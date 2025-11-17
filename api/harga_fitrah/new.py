from flask import jsonify
from datetime import datetime, timedelta
import json

def create_harga_fitrah(supabase_client, request):
    """Create a new harga_fitrah record with validation to ensure id_fitrah, id_jenis_fitrah, and keterangan are unique together"""
    try:
        # Get JSON data from request
        data = request.get_json()

        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided in request body'
            }), 400

        # Extract fields from request data
        id_fitrah = data.get('id_fitrah')
        id_jenis_fitrah = data.get('id_jenis_fitrah')
        id_pegawai = data.get('id_pegawai')
        keterangan = data.get('keterangan')
        nominal = data.get('nominal')
        aktif = data.get('aktif', True)  # Default to True if not provided
        berat = data.get('berat')

        # Validate required fields
        if id_fitrah is None:
            return jsonify({
                'success': False,
                'error': 'id_fitrah is required'
            }), 400

        if id_jenis_fitrah is None:
            return jsonify({
                'success': False,
                'error': 'id_jenis_fitrah is required'
            }), 400

        if keterangan is None:
            return jsonify({
                'success': False,
                'error': 'keterangan is required'
            }), 400

        # Validate that the combination of id_fitrah, id_jenis_fitrah, and keterangan is unique
        # Check if a record with the same combination already exists
        existing_record = supabase_client.table('harga_fitrah').select('*').eq('id_fitrah', id_fitrah).eq('id_jenis_fitrah', id_jenis_fitrah).eq('keterangan', keterangan).execute()
        
        if existing_record.data:
            return jsonify({
                'success': False,
                'error': 'A harga_fitrah record with the same id_fitrah, id_jenis_fitrah, and keterangan already exists'
            }), 409  # Conflict status code

        # Validate numeric fields
        if nominal is not None and not isinstance(nominal, (int, float)):
            return jsonify({
                'success': False,
                'error': 'nominal must be a number'
            }), 400

        if berat is not None and not isinstance(berat, (int, float)):
            return jsonify({
                'success': False,
                'error': 'berat must be a number'
            }), 400

        # Validate aktif is boolean
        if not isinstance(aktif, bool):
            return jsonify({
                'success': False,
                'error': 'aktif must be a boolean value (True/False)'
            }), 400

        # Prepare the insert data
        insert_data = {
            'id_fitrah': id_fitrah,
            'id_jenis_fitrah': id_jenis_fitrah,
            'id_pegawai': id_pegawai,
            'keterangan': keterangan,
            'nominal': nominal,
            'aktif': aktif,
            'berat': berat
        }

        # Remove None values to allow database defaults
        insert_data = {k: v for k, v in insert_data.items() if v is not None}

        # Insert data into harga_fitrah table
        response = supabase_client.table('harga_fitrah').insert(insert_data).execute()

        if response.data:
            created_record = response.data[0]

            # Format the created_at timestamp to GMT+8
            if created_record.get('created_at'):
                try:
                    # Parsing timestamp from ISO 8601 format (e.g., 2025-10-21T10:20:30.123456+00:00)
                    created_at_dt = datetime.fromisoformat(created_record['created_at'].replace('Z', '+00:00'))

                    # Add 8 hours for GMT+8
                    gmt8_dt = created_at_dt + timedelta(hours=8)

                    # Format to 'YYYY-MM-DD HH:mm'
                    created_record['created_at'] = gmt8_dt.strftime('%Y-%m-%d %H:%M')
                except Exception as e:
                    # If parsing fails, keep original format
                    print(f"Error formatting date: {e}")
                    pass

            return jsonify({
                'success': True,
                'message': 'Harga fitrah created successfully',
                'data': created_record
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to create harga fitrah'
            }), 500

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500