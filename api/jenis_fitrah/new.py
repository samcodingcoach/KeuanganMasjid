from flask import jsonify
from datetime import datetime, timedelta, timezone
import json

def create_jenis_fitrah(supabase_client, request):
    """Create a new jenis_fitrah record with nama_jenis and aktif fields"""
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided in request body'
            }), 400

        # Extract nama_jenis and aktif from request data
        nama_jenis = data.get('nama_jenis')
        aktif = data.get('aktif', True)  # Default to True if not provided
        
        # Validate required fields
        if not nama_jenis:
            return jsonify({
                'success': False,
                'error': 'nama_jenis is required'
            }), 400
            
        # Validate aktif is boolean
        if not isinstance(aktif, bool):
            return jsonify({
                'success': False,
                'error': 'aktif must be a boolean value (True/False)'
            }), 400

        # Insert data into jenis_fitrah table
        response = supabase_client.table('jenis_fitrah').insert({
            'nama_jenis': nama_jenis,
            'aktif': aktif
        }).execute()

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
                'message': 'Jenis fitrah created successfully',
                'data': created_record
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to create jenis fitrah'
            }), 500

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500