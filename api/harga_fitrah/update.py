from flask import jsonify
from datetime import datetime, timedelta
import json

def update_harga_fitrah(supabase_client, request):
    """Update a harga_fitrah record by id_hargafitrah with validation to ensure id_fitrah, id_jenis_fitrah, and keterangan are unique together"""
    try:
        # Get JSON data from request
        data = request.get_json()

        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided in request body'
            }), 400

        # Extract id_hargafitrah (required for WHERE clause)
        id_hargafitrah = data.get('id_hargafitrah')

        if id_hargafitrah is None:
            return jsonify({
                'success': False,
                'error': 'id_hargafitrah is required'
            }), 400

        # Extract fields that can be updated
        id_fitrah = data.get('id_fitrah')
        id_jenis_fitrah = data.get('id_jenis_fitrah')
        id_pegawai = data.get('id_pegawai')
        keterangan = data.get('keterangan')
        nominal = data.get('nominal')
        aktif = data.get('aktif')
        berat = data.get('berat')

        # Check if the record to update exists
        existing_record = supabase_client.table('harga_fitrah').select('*').eq('id_hargafitrah', id_hargafitrah).execute()
        
        if not existing_record.data:
            return jsonify({
                'success': False,
                'error': 'Harga fitrah record not found'
            }), 404

        # If id_fitrah, id_jenis_fitrah, or keterangan are being updated, validate uniqueness
        update_data = {}
        
        if id_fitrah is not None:
            update_data['id_fitrah'] = id_fitrah
        if id_jenis_fitrah is not None:
            update_data['id_jenis_fitrah'] = id_jenis_fitrah
        if keterangan is not None:
            update_data['keterangan'] = keterangan
        if id_pegawai is not None:
            update_data['id_pegawai'] = id_pegawai
        if nominal is not None:
            update_data['nominal'] = nominal
        if aktif is not None:
            if not isinstance(aktif, bool):
                return jsonify({
                    'success': False,
                    'error': 'aktif must be a boolean value (True/False)'
                }), 400
            update_data['aktif'] = aktif
        if berat is not None:
            if not isinstance(berat, (int, float)):
                return jsonify({
                    'success': False,
                    'error': 'berat must be a number'
                }), 400
            update_data['berat'] = berat

        # Determine the values to check for uniqueness
        current_id_fitrah = id_fitrah if id_fitrah is not None else existing_record.data[0]['id_fitrah']
        current_id_jenis_fitrah = id_jenis_fitrah if id_jenis_fitrah is not None else existing_record.data[0]['id_jenis_fitrah']
        current_keterangan = keterangan if keterangan is not None else existing_record.data[0]['keterangan']

        # Check if a record with the same combination already exists (excluding current record)
        existing_duplicate = supabase_client.table('harga_fitrah').select('*').eq('id_fitrah', current_id_fitrah).eq('id_jenis_fitrah', current_id_jenis_fitrah).eq('keterangan', current_keterangan).neq('id_hargafitrah', id_hargafitrah).execute()
        
        if existing_duplicate.data:
            return jsonify({
                'success': False,
                'error': 'Data fitrah already exists'
            }), 409  # Conflict status code

        # Update data in harga_fitrah table
        response = supabase_client.table('harga_fitrah').update(update_data).eq('id_hargafitrah', id_hargafitrah).execute()

        if response.data:
            updated_record = response.data[0]

            # Format the created_at timestamp to GMT+8
            if updated_record.get('created_at'):
                try:
                    # Parsing timestamp from ISO 8601 format (e.g., 2025-10-21T10:20:30.123456+00:00)
                    created_at_dt = datetime.fromisoformat(updated_record['created_at'].replace('Z', '+00:00'))

                    # Add 8 hours for GMT+8
                    gmt8_dt = created_at_dt + timedelta(hours=8)

                    # Format to 'YYYY-MM-DD HH:mm'
                    updated_record['created_at'] = gmt8_dt.strftime('%Y-%m-%d %H:%M')
                except Exception as e:
                    # If parsing fails, keep original format
                    print(f"Error formatting date: {e}")
                    pass

            return jsonify({
                'success': True,
                'message': 'Harga fitrah updated successfully',
                'data': updated_record
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update harga fitrah'
            }), 500

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500