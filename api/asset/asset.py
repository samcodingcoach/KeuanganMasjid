from flask import jsonify
from datetime import datetime

def get_all_assets(supabase_client):
    """Get all asset data with related pegawai information"""
    try:
        # Get all assets
        asset_response = supabase_client.table('asset').select(
            'id_asset, created_at, kode_barang, nama_barang, jenis_asset, harga, aktif, "isBroken", "isHibah", id_pegawai'
        ).execute()
        
        if not asset_response.data:
            return jsonify({
                'success': True,
                'message': 'Tidak ada data asset',
                'data': []
            })
        
        # Get all pegawai data
        pegawai_response = supabase_client.table('pegawai').select(
            'id_pegawai, nama_lengkap, "role"'
        ).execute()
        
        # Create a mapping of pegawai by id for quick lookup
        pegawai_map = {pegawai['id_pegawai']: pegawai for pegawai in pegawai_response.data}
        
        # Join the data
        result_data = []
        for asset in asset_response.data:
            # Format created_at timestamp
            if asset.get('created_at'):
                created_at_dt = datetime.fromisoformat(asset['created_at'].replace('Z', '+00:00'))
                asset['created_at'] = created_at_dt.strftime('%Y-%m-%d %H:%M')
            
            # Add pegawai information to the asset
            pegawai_info = pegawai_map.get(asset['id_pegawai'], {})
            asset['nama_lengkap'] = pegawai_info.get('nama_lengkap', '')
            asset['role'] = pegawai_info.get('role', '')
            
            result_data.append(asset)
        
        return jsonify({
            'success': True,
            'message': 'Semua data asset',
            'data': result_data,
            'count': len(result_data)
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


def get_asset_by_kode_barang(supabase_client, kode_barang):
    """Get specific asset data by kode_barang with related pegawai information"""
    try:
        # Get asset with specific kode_barang
        asset_response = supabase_client.table('asset').select(
            'id_asset, created_at, kode_barang, nama_barang, jenis_asset, harga, aktif, "isBroken", "isHibah", id_pegawai'
        ).eq('kode_barang', kode_barang).execute()
        
        if not asset_response.data:
            return jsonify({
                'success': True,
                'message': f'Tidak ada data asset dengan kode_barang: {kode_barang}',
                'data': []
            })
        
        # Get all pegawai data
        pegawai_response = supabase_client.table('pegawai').select(
            'id_pegawai, nama_lengkap, "role"'
        ).execute()
        
        # Create a mapping of pegawai by id for quick lookup
        pegawai_map = {pegawai['id_pegawai']: pegawai for pegawai in pegawai_response.data}
        
        # Join the data
        result_data = []
        for asset in asset_response.data:
            # Format created_at timestamp
            if asset.get('created_at'):
                created_at_dt = datetime.fromisoformat(asset['created_at'].replace('Z', '+00:00'))
                asset['created_at'] = created_at_dt.strftime('%Y-%m-%d %H:%M')
            
            # Add pegawai information to the asset
            pegawai_info = pegawai_map.get(asset['id_pegawai'], {})
            asset['nama_lengkap'] = pegawai_info.get('nama_lengkap', '')
            asset['role'] = pegawai_info.get('role', '')
            
            result_data.append(asset)
        
        return jsonify({
            'success': True,
            'message': f'Data asset dengan kode_barang: {kode_barang}',
            'data': result_data,
            'count': len(result_data)
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500