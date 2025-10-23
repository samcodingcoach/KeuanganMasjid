from flask import jsonify
from datetime import datetime

def create_mustahik(supabase_client, request):
    """Create a new mustahik"""
    try:
        # Get JSON data from request
        data = request.get_json()
        
        # Validate required fields
        # Based on the requirements, only nama_lengkap seems essential, but we'll allow flexible input
        if 'nama_lengkap' not in data:
            return jsonify({
                'success': False,
                'error': 'nama_lengkap is required'
            }), 400
        
        # Prepare the mustahik data
        mustahik_data = {
            'nama_lengkap': data['nama_lengkap']
        }
        
        # Add optional fields if they exist in the request
        if 'kategori' in data:
            mustahik_data['kategori'] = data['kategori']
        
        if 'alamat' in data:
            mustahik_data['alamat'] = data['alamat']
        
        if 'no_telepon' in data:
            mustahik_data['no_telepon'] = data['no_telepon']
        
        if 'no_ktp' in data:
            mustahik_data['no_ktp'] = data['no_ktp']
        
        if 'gps' in data:
            mustahik_data['gps'] = data['gps']
        
        if 'fakir' in data:
            mustahik_data['fakir'] = bool(data['fakir'])
        
        if 'tanggal_lahir' in data:
            # Validate date format (expecting YYYY-MM-DD)
            try:
                # Parse and reformat the date to ensure correct format
                tanggal_lahir = datetime.strptime(data['tanggal_lahir'], '%Y-%m-%d')
                mustahik_data['tanggal_lahir'] = tanggal_lahir.strftime('%Y-%m-%d')
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid date format for tanggal_lahir. Expected YYYY-MM-DD'
                }), 400
        
        if 'aktif' in data:
            mustahik_data['aktif'] = bool(data['aktif'])
        
        if 'keterangan' in data:
            mustahik_data['keterangan'] = data['keterangan']
        
        # Insert the new mustahik
        response = supabase_client.table('mustahik').insert(mustahik_data).execute()
        
        if response.data:
            # Get the inserted mustahik
            new_mustahik = response.data[0]
            
            # Format timestamp if exists
            if new_mustahik.get('created_at'):
                created_at_dt = datetime.fromisoformat(new_mustahik['created_at'].replace('Z', '+00:00'))
                new_mustahik['created_at'] = created_at_dt.strftime('%Y-%m-%d %H:%M')
            
            # Format tanggal_lahir if exists
            if new_mustahik.get('tanggal_lahir'):
                try:
                    tanggal_lahir_dt = datetime.strptime(new_mustahik['tanggal_lahir'], '%Y-%m-%d')
                    new_mustahik['tanggal_lahir'] = tanggal_lahir_dt.strftime('%Y-%m-%d')
                except ValueError:
                    pass  # If date formatting fails, keep original value
            
            return jsonify({
                'success': True,
                'message': 'Mustahik created successfully',
                'data': new_mustahik
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to create mustahik'
            }), 500

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500