from flask import jsonify
from datetime import datetime

def update_asset(supabase_client, request):
    """Update an asset by kode_barang"""
    try:
        # Get JSON data from request
        data = request.get_json()
        
        # Extract kode_barang from the request data
        kode_barang = data.get('kode_barang')
        if not kode_barang:
            return jsonify({
                'success': False,
                'error': 'kode_barang is required for update'
            }), 400
        
        # Check if the asset with provided kode_barang exists
        existing_asset = supabase_client.table('asset').select('*').eq('kode_barang', kode_barang).execute()
        
        if not existing_asset.data:
            return jsonify({
                'success': False,
                'error': f'Asset with kode_barang {kode_barang} does not exist'
            }), 400
        
        # Prepare the update data (only include fields that are provided in the request)
        update_data = {}
        
        if 'nama_barang' in data:
            update_data['nama_barang'] = data['nama_barang']
        
        if 'jenis_asset' in data:
            update_data['jenis_asset'] = data['jenis_asset']
            
        if 'harga' in data:
            harga_value = float(data['harga'])  # Convert to numeric first
            # If the value is a whole number, convert to int to avoid decimal point
            if harga_value.is_integer():
                harga_value = int(harga_value)
            update_data['harga'] = harga_value
        
        if 'aktif' in data:
            update_data['aktif'] = bool(data['aktif'])
        
        if 'isBroken' in data:
            update_data['isBroken'] = bool(data['isBroken'])
        
        if 'isHibah' in data:
            update_data['isHibah'] = bool(data['isHibah'])
        
        if 'id_pegawai' in data:
            update_data['id_pegawai'] = data['id_pegawai']
        
        if 'url_gambar' in data:
            update_data['url_gambar'] = data['url_gambar']
        
        # Check if no fields to update
        if not update_data:
            return jsonify({
                'success': False,
                'error': 'No fields provided for update'
            }), 400
        
        # Update the asset
        response = supabase_client.table('asset').update(update_data).eq('kode_barang', kode_barang).execute()
        
        if response.data:
            # Get the updated asset with pegawai information
            updated_asset = response.data[0]
            
            # Get pegawai information
            pegawai_response = supabase_client.table('pegawai').select(
                'nama_lengkap, "role"'
            ).eq('id_pegawai', updated_asset['id_pegawai']).execute()
            
            pegawai_info = {}
            if pegawai_response.data:
                pegawai_info = pegawai_response.data[0]
            
            # Format the response
            updated_asset['nama_lengkap'] = pegawai_info.get('nama_lengkap', '')
            updated_asset['role'] = pegawai_info.get('role', '')
            
            # Format timestamp
            if updated_asset.get('created_at'):
                created_at_dt = datetime.fromisoformat(updated_asset['created_at'].replace('Z', '+00:00'))
                updated_asset['created_at'] = created_at_dt.strftime('%Y-%m-%d %H:%M')
            
            return jsonify({
                'success': True,
                'message': 'Asset updated successfully',
                'data': updated_asset
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update asset'
            }), 500

    except ValueError as ve:
        return jsonify({
            'success': False,
            'error': f'Invalid data format: {str(ve)}'
        }), 400
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500