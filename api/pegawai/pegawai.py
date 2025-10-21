from flask import jsonify
from datetime import datetime

def get_pegawai(supabase_client):
    """Get all pegawai data"""
    try:
        # Sesuai permintaan, kolom password kini ditampilkan. PERINGATAN: Risiko keamanan.
        response = supabase_client.table('pegawai').select(
            'id_pegawai, created_at, nama_lengkap, email, password, role'
        ).execute()

        if response.data:
            formatted_data = []
            for record in response.data:
                # Parsing timestamp dari format ISO 8601 (contoh: 2025-10-21T10:20:30.123456+00:00)
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
            return jsonify({
                'success': True, 
                'message': 'Tidak ada data pegawai',
                'data': []
            })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
