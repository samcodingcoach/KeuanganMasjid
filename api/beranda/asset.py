"""API to get asset statistics from beranda"""
from flask import jsonify


def get_asset_statistics(supabase_client):
    """Get count of active and non-broken assets along with total price sum."""
    try:
        # Fetch assets that are active and not broken
        response = supabase_client.table('asset').select('harga, aktif, isBroken').execute()
        
        if not response.data:
            return jsonify({
                'success': False,
                'message': 'Tidak ada data atau RLS policy memblokir akses',
                'data': {
                    'active_and_not_broken_count': 0,
                    'total_harga': 0
                }
            })
        
        active_not_broken_count = 0
        total_harga = 0
        
        for item in response.data:
            aktif = item.get('aktif', True)  # Default to True if null
            is_broken = item.get('isBroken', False)  # Default to False if null
            harga = item.get('harga')
            
            # Check if asset is active and not broken
            if aktif is True and is_broken is False:
                active_not_broken_count += 1
                
                # Add to total harga if harga is not None
                if harga is not None:
                    try:
                        # Convert to float if it's a string
                        harga = float(harga) if isinstance(harga, (str, int)) else harga
                        total_harga += harga
                    except (ValueError, TypeError):
                        # If conversion fails, skip this asset's price
                        continue
        
        result = {
            'active_and_not_broken_count': active_not_broken_count,
            'total_harga': total_harga
        }
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500