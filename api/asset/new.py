from flask import jsonify
from datetime import datetime

def create_asset(supabase_client, request):
    """Create a new asset with duplicate kode_barang checking"""
    try:
        # Get JSON data from request
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['kode_barang', 'nama_barang', 'jenis_asset', 'harga', 'aktif', 'isBroken', 'isHibah', 'id_pegawai']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Field {field} is required'
                }), 400
        
        # Check if kode_barang already exists
        existing_asset = supabase_client.table('asset').select('kode_barang').eq('kode_barang', data['kode_barang']).execute()
        
        if existing_asset.data:
            return jsonify({
                'success': False,
                'error': f'Kode barang {data["kode_barang"]} already exists'
            }), 400
        
        # Prepare the asset data
        harga_value = float(data['harga'])  # Convert to numeric first
        # If the value is a whole number, convert to int to avoid decimal point
        if harga_value.is_integer():
            harga_value = int(harga_value)
        
        print(f"Received data for asset creation: {data}")
        
        asset_data = {
            'kode_barang': data['kode_barang'],
            'nama_barang': data['nama_barang'],
            'jenis_asset': data['jenis_asset'],
            'harga': harga_value,
            'aktif': bool(data['aktif']),
            'isBroken': bool(data['isBroken']),
            'isHibah': bool(data['isHibah']),
            'id_pegawai': data['id_pegawai']
        }
        
        # Add optional url_gambar field (handles both null and string values)
        if 'url_gambar' in data:
            asset_data['url_gambar'] = data['url_gambar']
            print(f"Adding url_gambar to asset_data: {data['url_gambar']}")
        else:
            print("url_gambar not in data")
        
        print(f"Final asset_data before insert: {asset_data}")
        
        # Insert the new asset
        print(f"Attempting to insert asset with data: {asset_data}")
        response = supabase_client.table('asset').insert(asset_data).execute()
        print(f"Supabase insert response: {response}")
        
        if response.data:
            # Get the inserted asset with pegawai information
            new_asset = response.data[0]
            print(f"New asset created with ID: {new_asset.get('id_asset')}, url_gambar: {new_asset.get('url_gambar')}")
            
            # Get pegawai information
            pegawai_response = supabase_client.table('pegawai').select(
                'nama_lengkap, "role"'
            ).eq('id_pegawai', new_asset['id_pegawai']).execute()
            
            pegawai_info = {}
            if pegawai_response.data:
                pegawai_info = pegawai_response.data[0]
            
            # Format the response
            new_asset['nama_lengkap'] = pegawai_info.get('nama_lengkap', '')
            new_asset['role'] = pegawai_info.get('role', '')
            
            # Format timestamp
            if new_asset.get('created_at'):
                created_at_dt = datetime.fromisoformat(new_asset['created_at'].replace('Z', '+00:00'))
                new_asset['created_at'] = created_at_dt.strftime('%Y-%m-%d %H:%M')
            
            return jsonify({
                'success': True,
                'message': 'Asset created successfully',
                'data': new_asset
            })
        else:
            print("Failed to create asset - no data returned from insert")
            return jsonify({
                'success': False,
                'error': 'Failed to create asset'
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