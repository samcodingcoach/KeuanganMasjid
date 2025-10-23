from flask import jsonify
from datetime import datetime

def update_mustahik(supabase_client, request):
    """Update a mustahik by id_mustahik"""
    try:
        # Get JSON data from request
        data = request.get_json()
        
        # Extract id_mustahik from the request data
        id_mustahik = data.get('id_mustahik')
        if not id_mustahik:
            return jsonify({
                'success': False,
                'error': 'id_mustahik is required for update'
            }), 400
        
        # Check if the mustahik with provided id_mustahik exists
        existing_mustahik = supabase_client.table('mustahik').select('*').eq('id_mustahik', id_mustahik).execute()
        
        if not existing_mustahik.data:
            return jsonify({
                'success': False,
                'error': f'Mustahik with id_mustahik {id_mustahik} does not exist'
            }), 400
        
        # Prepare the update data (only include fields that are provided in the request)
        update_data = {}
        
        if 'nama_lengkap' in data:
            update_data['nama_lengkap'] = data['nama_lengkap']
        
        if 'kategori' in data:
            update_data['kategori'] = data['kategori']
        
        if 'alamat' in data:
            update_data['alamat'] = data['alamat']
        
        if 'no_telepon' in data:
            update_data['no_telepon'] = data['no_telepon']
        
        if 'no_ktp' in data:
            update_data['no_ktp'] = data['no_ktp']
        
        if 'gps' in data:
            update_data['gps'] = data['gps']
        
        if 'fakir' in data:
            update_data['fakir'] = bool(data['fakir'])
        
        if 'tanggal_lahir' in data:
            # Validate date format (expecting YYYY-MM-DD)
            try:
                # Parse and reformat the date to ensure correct format
                tanggal_lahir = datetime.strptime(data['tanggal_lahir'], '%Y-%m-%d')
                update_data['tanggal_lahir'] = tanggal_lahir.strftime('%Y-%m-%d')
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid date format for tanggal_lahir. Expected YYYY-MM-DD'
                }), 400
        
        if 'aktif' in data:
            update_data['aktif'] = bool(data['aktif'])
        
        if 'keterangan' in data:
            update_data['keterangan'] = data['keterangan']
        
        # Check if no fields to update
        if not update_data:
            return jsonify({
                'success': False,
                'error': 'No fields provided for update'
            }), 400
        
        # Update the mustahik
        response = supabase_client.table('mustahik').update(update_data).eq('id_mustahik', id_mustahik).execute()
        
        if response.data:
            # Get the updated mustahik
            updated_mustahik = response.data[0]
            
            # Format timestamp if exists
            if updated_mustahik.get('created_at'):
                created_at_dt = datetime.fromisoformat(updated_mustahik['created_at'].replace('Z', '+00:00'))
                updated_mustahik['created_at'] = created_at_dt.strftime('%Y-%m-%d %H:%M')
            
            # Format tanggal_lahir if exists
            if updated_mustahik.get('tanggal_lahir'):
                try:
                    tanggal_lahir_dt = datetime.strptime(updated_mustahik['tanggal_lahir'], '%Y-%m-%d')
                    updated_mustahik['tanggal_lahir'] = tanggal_lahir_dt.strftime('%Y-%m-%d')
                except ValueError:
                    pass  # If date formatting fails, keep original value
            
            return jsonify({
                'success': True,
                'message': 'Mustahik updated successfully',
                'data': updated_mustahik
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update mustahik'
            }), 500

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500