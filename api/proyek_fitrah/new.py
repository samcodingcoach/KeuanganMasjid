from flask import jsonify
from datetime import datetime, timedelta
import json

def create_proyek_fitrah(supabase_client, request):
    """Create a new proyek_fitrah record with tahun_hijriah, penanggung_jawab and aktif fields"""
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided in request body'
            }), 400

        # Extract tahun_hijriah, penanggung_jawab and aktif from request data
        tahun_hijriah = data.get('tahun_hijriah')
        penanggung_jawab = data.get('penanggung_jawab')
        aktif = data.get('aktif', True)  # Default to True if not provided
        
        # Validate required fields
        if not tahun_hijriah:
            return jsonify({
                'success': False,
                'error': 'tahun_hijriah is required'
            }), 400
            
        # Validate tahun_hijriah is a 4-digit number
        try:
            tahun_hijriah = int(tahun_hijriah)
            if len(str(tahun_hijriah)) != 4:
                return jsonify({
                    'success': False,
                    'error': 'tahun_hijriah must be a 4-digit number'
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': 'tahun_hijriah must be a valid number'
            }), 400

        # Validate aktif is boolean
        if not isinstance(aktif, bool):
            return jsonify({
                'success': False,
                'error': 'aktif must be a boolean value (True/False)'
            }), 400

        # Insert data into proyek_fitrah table
        response = supabase_client.table('proyek_fitrah').insert({
            'tahun_hijriah': tahun_hijriah,
            'penanggung_jawab': penanggung_jawab,
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
                'message': 'Proyek fitrah created successfully',
                'data': created_record
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to create proyek fitrah'
            }), 500

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500