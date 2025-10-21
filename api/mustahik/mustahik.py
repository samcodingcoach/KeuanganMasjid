from flask import jsonify
from datetime import datetime

def get_mustahik(supabase_client):
    """Mengambil semua data mustahik"""
    try:
        # Mengambil semua kolom dari tabel mustahik
        response = supabase_client.table('mustahik').select('*').execute()

        if response.data:
            formatted_data = []
            for record in response.data:
                if record.get('created_at'):
                    # Parsing timestamp dari format ISO 8601
                    created_at_dt = datetime.fromisoformat(record['created_at'])
                    # Format ulang ke 'YYYY-MM-DD HH:mm'
                    record['created_at'] = created_at_dt.strftime('%Y-%m-%d %H:%M')
                formatted_data.append(record)
            
            return jsonify({
                'success': True,
                'data': formatted_data,
                'count': len(formatted_data)
            })
        else:
            # Jika tidak ada data, kembalikan list kosong.
            return jsonify({
                'success': True,
                'message': 'Tidak ada data mustahik',
                'data': []
            })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
