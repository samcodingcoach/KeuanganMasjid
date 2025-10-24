from flask import jsonify
from datetime import datetime

def get_muzakki_list(supabase_client):
    """Get all muzakki data with specified fields"""
    try:
        response = supabase_client.table('muzakki').select(
            'id_muzakki, nama_lengkap, alamat, no_telepon, no_ktp, gps, fakir, tanggal_lahir, aktif, keterangan, created_at, kategori'
        ).execute()

        if response.data:
            formatted_data = []
            for record in response.data:
                # Parsing timestamp dari format ISO 8601 (contoh: 2025-10-21T10:20:30.123456+00:00)
                if record.get('created_at'):
                    created_at_dt = datetime.fromisoformat(record['created_at'])
                    # Format ulang ke 'YYYY-MM-DD HH:mm'
                    record['created_at'] = created_at_dt.strftime('%Y-%m-%d %H:%M')
                
                # Format tanggal_lahir jika ada
                if record.get('tanggal_lahir'):
                    try:
                        tanggal_lahir_dt = datetime.fromisoformat(record['tanggal_lahir'])
                        record['tanggal_lahir'] = tanggal_lahir_dt.strftime('%Y-%m-%d')
                    except:
                        pass  # Biarkan format asli jika gagal parsing
                
                formatted_data.append(record)
            
            return jsonify({
                'success': True,
                'data': formatted_data,
                'count': len(formatted_data)
            })
        else:
            return jsonify({
                'success': True, 
                'message': 'Tidak ada data muzakki',
                'data': []
            })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
