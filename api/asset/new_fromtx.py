from flask import jsonify
import json

def create_asset_from_transaction(supabase_client, asset_data_list, id_pegawai, nominal):
    """Create asset records from transaction detail when isAsset is true"""
    try:
        # Validate required fields
        if not asset_data_list or not id_pegawai or nominal is None:
            return jsonify({'error': 'assetData, id_pegawai, and nominal are required'}), 400

        # Validate asset data
        if not isinstance(asset_data_list, list) or len(asset_data_list) == 0:
            return jsonify({'error': 'assetData must be a non-empty list'}), 400

        created_assets = []

        for idx, asset_data in enumerate(asset_data_list):
            # Validate each asset data
            if not isinstance(asset_data, dict):
                return jsonify({'error': f'Asset data at index {idx} must be an object'}), 400

            # Required fields for each asset
            asset_required_fields = ['kode_barang', 'nama_barang', 'jenis_barang']
            for field in asset_required_fields:
                if field not in asset_data or not asset_data[field]:
                    return jsonify({'error': f'{field} is required for asset at index {idx}'}), 400

            # Prepare asset data for insertion
            asset_record = {
                'kode_barang': asset_data['kode_barang'],
                'nama_barang': asset_data['nama_barang'],
                'jenis_asset': asset_data['jenis_barang'],  # Note: using 'jenis_barang' from frontend as 'jenis_asset'
                'harga': float(nominal),  # Use the nominal from transaction as the price
                'aktif': True,  # Always active when created from transaction
                'isBroken': False,  # Default to not broken
                'isHibah': False,  # Default to not a donation
                'id_pegawai': id_pegawai,  # From session
                'url_gambar': None  # Optional - no image initially
            }

            # Insert the asset record
            response = supabase_client.table('asset').insert(asset_record).execute()

            if response.data:
                created_asset = response.data[0]
                created_assets.append(created_asset)
            else:
                return jsonify({'error': f'Failed to create asset {idx + 1}'}), 500

        return jsonify({
            'success': True,
            'message': f'Successfully created {len(created_assets)} asset(s)',
            'data': created_assets
        }), 200

    except Exception as e:
        print(f"Error creating asset from transaction: {str(e)}")
        return jsonify({'error': str(e)}), 500