'''Api for Kategori'''
from flask import jsonify

def get_kategori_transaksi(supabase_client):
    '''Get all kategori transaksi'''
    try:
        response = supabase_client.table('kategori_transaksi').select('*').execute()
        
        if response.data:
            return jsonify({
                'success': True,
                'data': response.data,
                'count': len(response.data)
            })
        return jsonify({
            'success': False,
            'message': 'Tidak ada data atau RLS policy memblokir akses',
            'data': []
        })
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
