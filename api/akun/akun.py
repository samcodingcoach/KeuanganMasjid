'''Api for Akun'''
from flask import jsonify
from datetime import datetime

def get_akun_kas_bank(supabase_client):
    '''Get all akun kas bank'''
    try:
        response = supabase_client.table('akun_kas_bank').select('*').execute()
        
        if response.data:
            # Format created_at to YYYY-MM-DD HH:mm
            for item in response.data:
                if item.get('created_at'):
                    created_at = datetime.fromisoformat(item['created_at'].replace('Z', '+00:00'))
                    item['created_at'] = created_at.strftime('%Y-%m-%d %H:%M')
            
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
