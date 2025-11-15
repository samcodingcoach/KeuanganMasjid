from flask import jsonify
from datetime import datetime, timedelta, timezone
import json

def update_jenis_fitrah(supabase_client, request):
    """Update an existing jenis_fitrah record"""
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided in request body'
            }), 400

        # Extract id_jenis_fitrah (required to identify the record to update)
        id_jenis_fitrah = data.get('id_jenis_fitrah')
        
        if not id_jenis_fitrah:
            return jsonify({
                'success': False,
                'error': 'id_jenis_fitrah is required'
            }), 400

        # Extract nama_jenis and aktif from request data
        nama_jenis = data.get('nama_jenis')
        aktif = data.get('aktif')
        
        # At least one field to update must be provided
        if nama_jenis is None and aktif is None:
            return jsonify({
                'success': False,
                'error': 'At least one field to update (nama_jenis or aktif) must be provided'
            }), 400

        # Validate aktif is boolean if provided
        if aktif is not None and not isinstance(aktif, bool):
            return jsonify({
                'success': False,
                'error': 'aktif must be a boolean value (True/False)'
            }), 400

        # Prepare update data
        update_data = {}
        if nama_jenis is not None:
            update_data['nama_jenis'] = nama_jenis
        if aktif is not None:
            update_data['aktif'] = aktif

        # Update data in jenis_fitrah table
        response = supabase_client.table('jenis_fitrah').update(update_data).eq('id_jenis_fitrah', id_jenis_fitrah).execute()

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
                'message': 'Jenis fitrah updated successfully',
                'data': updated_record
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No record found or update failed'
            }), 404

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500