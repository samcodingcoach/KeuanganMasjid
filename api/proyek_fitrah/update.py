from flask import jsonify
from datetime import datetime, timedelta
import json

def update_proyek_fitrah(supabase_client, request):
    """Update an existing proyek_fitrah record"""
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided in request body'
            }), 400

        # Extract id_fitrah (required to identify the record to update)
        id_fitrah = data.get('id_fitrah')
        
        if not id_fitrah:
            return jsonify({
                'success': False,
                'error': 'id_fitrah is required'
            }), 400

        # Extract tahun_hijriah, penanggung_jawab and aktif from request data
        tahun_hijriah = data.get('tahun_hijriah')
        penanggung_jawab = data.get('penanggung_jawab')
        aktif = data.get('aktif')
        
        # At least one field to update must be provided
        if tahun_hijriah is None and penanggung_jawab is None and aktif is None:
            return jsonify({
                'success': False,
                'error': 'At least one field to update (tahun_hijriah, penanggung_jawab, or aktif) must be provided'
            }), 400

        # Validate tahun_hijriah is a 4-digit number if provided
        if tahun_hijriah is not None:
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

        # Validate aktif is boolean if provided
        if aktif is not None and not isinstance(aktif, bool):
            return jsonify({
                'success': False,
                'error': 'aktif must be a boolean value (True/False)'
            }), 400

        # Prepare update data
        update_data = {}
        if tahun_hijriah is not None:
            update_data['tahun_hijriah'] = tahun_hijriah
        if penanggung_jawab is not None:
            update_data['penanggung_jawab'] = penanggung_jawab
        if aktif is not None:
            update_data['aktif'] = aktif

        # Update data in proyek_fitrah table
        response = supabase_client.table('proyek_fitrah').update(update_data).eq('id_fitrah', id_fitrah).execute()

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
                'message': 'Proyek fitrah updated successfully',
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